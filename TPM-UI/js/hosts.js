function generateNewItemEntry(hostID, hostLabel, status, lastUpdated) {
    let stText = "Other";
    if(!status) stText = "Unknown";
    if(status == "healthy") stText = "Healthy";
    if(status == "corrupt") stText = "Corrupted";

    return `   <tr class="lsi-show-detail" data-id="${hostID}">
                        <td>${hostLabel}</td>
                        <td class="${status === "healthy" ? "ls-success" : "ls-mismatch"}">${stText}</td>
                        <td>${getRelativeTime(lastUpdated)}</td>
                        <td class="lsi-icon">-></td>
                    </tr>`
}


async function renderInformation() {
    let hostsList = await fetchData('/inventory/')
    let tableContent = "";
    if (!hostsList) {
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
        return;
    }
    
    if(!hostsList.result || !hostsList.result.success) {
        document.querySelector('#error-body').textContent = `API has returned an error: ${hostsList.result ? hostsList.result.message : "API schema is invalid (Front-end)."}`;
        document.querySelector('#error-fh').classList.remove('dn');
        document.querySelector('#content-still-loading').classList.add('dn');
    }

    hostsList.hostList.forEach(element => {
        tableContent += generateNewItemEntry(element["host_id"], element["host_name"], element["health_status"], element["health_last_updated"]);
    });

    document.querySelector('#hosts-list-append').innerHTML = tableContent;

    // add click event

    document.querySelectorAll('.lsi-show-detail').forEach((elem)=>{
        console.log(elem);
        elem.addEventListener('click', ()=>{
            window.location.href = "/measurements.html?hostID=" + elem.dataset.id;
        })
    })

    document.querySelector('#content-still-loading').classList.add('dn');
}


renderInformation();