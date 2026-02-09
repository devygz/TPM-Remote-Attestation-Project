let hostIDVal = "";

function generateNewItemEntry(measID, measTimestamp, measResult, measMismatchedText) {
    let measViewText = "Error";
    if(measResult === "golden") {
        measViewText = `<span class="ls-golden">Golden</span>`;
    }
    if(measResult === "matched") measViewText = `<span class="ls-healthy">Matched</span>`;
    if(measResult === "mismatch") measViewText = `<span class="ls-mismatch">Mismatch</span>`;
    return `     <tr class="lsi-show-detail" data-id="${measID}">
                        <td>${getRelativeTime(measTimestamp)}</td>
                        <td>${measViewText}</td>
                        <td class="ls-mm-detail">${measMismatchedText}</td>
                    </tr>`
}

async function renderInformation() {
    const params = new URLSearchParams(window.location.search);
    const hostID = params.get('hostID');
    let elemCount = 0;
    let mismatchCount = 0;

    if (!hostID || hostID === "" || hostID === undefined) {
        document.querySelector('#error-body').textContent = `No query parameter has been supplied. Expected hostID.`;
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
    }
    hostIDVal = hostID;
    let hostInformation = await fetchData('/inventory/' + hostID);
    let measurementsList = await fetchData('/inventory/measurements/' + hostID);

    let tableContent = "";

    if (!hostInformation || !measurementsList) {
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
        return;
    }

    if (!hostInformation.result || !hostInformation.result.success || !measurementsList.result || !measurementsList.result.success) {
        // TODO: also add host 
        document.querySelector('#error-body').textContent = `API has returned an error: ${measurementsList.result ? measurementsList.result.message : "API schema is invalid (Front-end)."}`;
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
    }

    if (!hostInformation["hostInfo"]) {
        document.querySelector('#error-body').textContent = `Specified host couldn't be found in the database.`;
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
    }

    document.querySelector('#hostLabel').textContent = hostInformation.hostInfo["host_name"];
    document.querySelector('#hostDescription').textContent = hostInformation.hostInfo["description"] || "(No description provided)";
    document.querySelector('#hostAddr').textContent = hostInformation.hostInfo["host_addr"] || "(No address provided)";
    document.querySelector('#connectionStatus').innerHTML = hostInformation.hostInfo["health_status"] === "healthy" ? '<span class="ls-success">Healthy</span>' : '<span class="ls-mismatch">Corrupt</span>';
    document.querySelector('#pairingKey').textContent = hostInformation.hostInfo["host_auth_pw"];
    // TODO document.querySelector('#successRatio').textContent = hostInformation.hostInfo["health_status"] === "healthy" ? "Healthy" : "Corrupt";



    measurementsList.measurements.forEach(element => {
        let mismatched_desc = [];
        elemCount += 1;



        if (!element["gs_matched"]) {
            // Mismatch
            mismatchCount += 1;

            if (element["mismatched_elements"]) {
                element["mismatched_elements"] = element["mismatched_elements"].split(",");
                console.log(element["mismatched_elements"]);

                element["mismatched_elements"].forEach((elem) => {
                    if (Object.hasOwn(PCR_KEYS_MAP, elem)) {
                        mismatched_desc.push(`${elem.replace('tpm_', '')}: ${PCR_KEYS_MAP[elem]}`);
                    } else {
                        mismatched_desc.push(`${elem.replace('tpm_', '')}`);
                    }
                })
            }else{
                mismatched_desc = ['<span class="ls-mismatch">(No mismatch list)</span>'];
            }



        } else {
            // Good
            mismatched_desc = ['<span class="ls-muted">(None)</span>'];
        }

        let gsMatchView = element["gs_matched"] === 1 ? "matched" : "mismatch";
        if(element["gold_state"] === 1) gsMatchView = "golden";

        tableContent = generateNewItemEntry(element["measurement_id"], element["created_at"], gsMatchView, mismatched_desc.join(';&nbsp;&nbsp;')) + tableContent; // to allow last measurement to be first listed
    });
    console.log({ elemCount, mismatchCount, "measlen": measurementsList.measurements.length })
    let mmRatio = ((elemCount - mismatchCount) / elemCount) * 100

    document.querySelector('#meas-list-append').innerHTML = tableContent;
    document.querySelector('#successRatio').textContent = `${mmRatio.toFixed(2)}% (${elemCount - mismatchCount}/${elemCount})`;
    document.querySelector('#content-still-loading').classList.add('dn');

    // add click event

    document.querySelectorAll('.lsi-show-detail').forEach((elem)=>{
        console.log(elem);
        elem.addEventListener('click', ()=>{
            const userConfirmed = confirm("Are you sure that you want to set this measurement as Reference Measurement?");
            if (userConfirmed) {
                markAsGolden(elem.dataset.id);
            }
        })
    })

}

async function markAsGolden(measurementID) {
    if(!hostIDVal || !measurementID) {
        document.querySelector('#error-body').textContent = `Mark as golden failed: Host ID or Measurement ID cannot be found.`;
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
        return;
    }

    let requestBody = {
        host_id: hostIDVal,
        measurement_id: measurementID
    }

    let responseGS = await postData('/gs/mark', requestBody);
    if(!responseGS.result && !responseGS.result.success) {
        document.querySelector('#error-body').textContent = `Mark as golden failed - API Error: ${responseGS.result.message || "(API Parse ERROR)"}`;
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
    }

    document.querySelector('#success-body').textContent = `${responseGS.result.message}`;
    document.querySelector('#success-fh').classList.remove('dn');
    

    setTimeout(()=>{
        document.querySelector('#success-fh').classList.add('dn');
        renderInformation();
    }, 5000);

}

renderInformation();