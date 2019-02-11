const { events, Job, Group } = require("brigadier");

const shareFolder = "/mnt/brigade/share";
const areaName = "gelderland";
const downloadUrl = `europe/netherlands/${areaName}-latest.osm.pbf`
const pbfFilePath = `${shareFolder}/${areaName}-latest.osm.pbf`;
const osrmFilePath = `${shareFolder}/${areaName}-latest.osrm`;

events.on('exec', (e,p) => {
    jobs.importData(e,p);
});

const jobs = {
    importData: (e,p,env) => {
        const job = new Job("import-osrm-data", "osrm-backend");
        job.storage.enabled = true;
        job.tasks = [
            `curl http://download.geofabrik.de/${downloadUrl} -o ${pbfFilePath}`,
            `osrm-extract -p /opt/car.lua ${pbfFilePath}`,
            `osrm-partition ${osrmFilePath}`,
            `osrm-customize ${osrmFilePath}`
        ];
        return job;
    },

    copyOsrmData: (e,p,env) => {
        const copyJob = new Job('kubectl-copy-tiles', 'lachlanevenson/k8s-kubectl');
        copyJob.storage.enabled = true;
        copyJob.env = {
            BUILD_ID: e.buildID
        }

        copyJob.tasks = [
            `sh /src/copy-data.sh`
        ];

        return copyJob.run();
    }
}