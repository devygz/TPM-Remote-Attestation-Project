#!/usr/bin/env python3
import argparse
import json
import os
import socket
import subprocess
import requests
from pathlib import Path

# --- Configuration ---
CONFIG_FILE = Path.home() / ".arctic_credentials"
BASE_URL = "http://tpm-server.yagz.eu:3000"

def get_tpm_pcr(index):
    """Reads a specific PCR value using tpm2_pcrread."""
    try:
        result = subprocess.check_output(
            ["tpm2_pcrread", f"sha256:{index}"], 
            stderr=subprocess.STDOUT, 
            text=True
        )
        for line in result.splitlines():
            if ":" in line and "0x" in line:
                return line.split(":")[1].strip()
    except Exception:
        return "0000000000000000000000000000000000000000000000000000000000000000"

def get_tpm_manufacturer():
    """Gets the TPM manufacturer code."""
    try:
        result = subprocess.check_output(["tpm2_getcap", "properties-fixed"], text=True)
        for line in result.splitlines():
            if "TPM2_PT_MANUFACTURER" in line:
                # Extract the string part, e.g., IBM or NTC
                return line.split(":")[1].strip().replace('"', '')
    except:
        return "UNKNOWN"

def register(args):
    """Handles /inventory/register and extracts hostInfo."""
    payload = {
        "host_addr": socket.gethostname(),
        "description": args.description,
        "tpm_mfg_code": get_tpm_manufacturer(),
        "host_name": args.host_label
    }
    
    print(f"Registering host at {BASE_URL}/inventory/register...")
    try:
        response = requests.post(f"{BASE_URL}/inventory/register", json=payload)
        response.raise_for_status()
        full_data = response.json()

        # FIX: Extract ONLY the credentials from the 'hostInfo' key
        if "hostInfo" in full_data:
            creds = {
                "host_id": full_data["hostInfo"].get("host_id"),
                "host_auth_pw": full_data["hostInfo"].get("host_auth_pw")
            }
            with open(CONFIG_FILE, "w") as f:
                json.dump(creds, f, indent=4)
            print(f"Registration successful. Credentials saved to {CONFIG_FILE}")
        else:
            print("Error: API response did not contain 'hostInfo'. Check API output.")
            
    except Exception as e:
        print(f"Registration failed: {e}")

def update_posture():
    """Handles /posture/update using stored credentials."""
    if not CONFIG_FILE.exists():
        print(f"Error: {CONFIG_FILE} not found. Run --register first.")
        return

    with open(CONFIG_FILE, "r") as f:
        creds = json.load(f)
    
    payload = {
        "host_id": creds.get("host_id"),
        "host_auth_pw": creds.get("host_auth_pw"),
        "label": "TEST MEASUREMENT POST FROM API new",
    }
    
    # PCRs 0-7
    for i in range(8):
        payload[f"tpm_PCR{i}"] = get_tpm_pcr(i)

    print(f"Sending posture update for Host ID: {payload['host_id']}...")
    try:
        response = requests.post(f"{BASE_URL}/posture/update", json=payload)
        response.raise_for_status()
        print(f"Success! Server responded: {response.status_code}")
    except Exception as e:
        print(f"Failed to send update: {e}")

def main():
    parser = argparse.ArgumentParser(description="Arctic Agent")
    parser.add_argument("--register", action="store_true")
    parser.add_argument("--update", action="store_true")
    parser.add_argument("--description", type=str, default="Kubuntu VM Host")
    parser.add_argument("--host-label", type=str, default="Kubuntu VM Proxmox")

    args = parser.parse_args()

    if args.register:
        register(args)
    elif args.update:
        update_posture()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()