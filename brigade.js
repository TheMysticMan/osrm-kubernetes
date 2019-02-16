const { events, Job, Group } = require("brigadier");

const shareFolder = "/mnt/brigade/share";
const areaName = "netherlands";
const downloadUrl = `europe/${areaName}-latest.osm.pbf`;
const pbfFilePath = `${shareFolder}/${areaName}-latest.osm.pbf`;
const osrmFilePath = `${shareFolder}/${areaName}-latest.osrm`;

events.on('exec', (e, p) => {
    try {
        Group.runEach(
            [
                jobs.importData(e, p),
                jobs.copyOsrmData(e, p),
                jobs.deployNewVersion(e, p)
            ])
            .catch((err) => {
                console.log(err);
            });
    }
    catch (err) {
        console.log(err);
    };
});

const jobs = {
    importData: (e, p) => {
        const job = new Job("import-osrm-data", "osrm/osrm-backend");
        job.storage.enabled = true;
        job.timeout = 21600000;
        job.tasks = [
            `apt update && apt install curl -y`,
            `curl http://download.geofabrik.de/${downloadUrl} -o ${pbfFilePath}`,
            `osrm-extract -p /opt/car.lua ${pbfFilePath}`,
            `osrm-partition ${osrmFilePath}`,
            `osrm-customize ${osrmFilePath}`,
            'echo done'
        ];
        return job;
    },

    copyOsrmData: (e, p) => {
        const copyJob = new Job('kubectl-copy-osrm-data', 'lachlanevenson/k8s-kubectl');
        copyJob.storage.enabled = true;
        copyJob.env = {
            BUILD_ID: e.buildID
        }

        copyJob.tasks = [
            `sh /src/copy-data.sh`
        ];

        return copyJob;
    },

    deployNewVersion: (e, p) => {
        const deployJob = new Job('kubectl-deploy-osrm', 'lachlanevenson/k8s-kubectl');
        deployJob.storage.enabled = true;
        deployJob.env = {
            BUILD_ID: e.buildID
        }

        deployJob.tasks = [
            `sh /src/deployment/deploy.sh`
        ];

        return deployJob;
    }
}