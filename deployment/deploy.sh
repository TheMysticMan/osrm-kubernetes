#Check if service is created. Otherwise we'll create it
echo "check if osrm service exists."
DELETE_EXISTING=false
if kubectl get service osrm; 
then
    echo "osrm service already exists."
    DELETE_EXISTING=true
else
    echo "tileserver service doesn't exist. Creating it now."
    cat ./deployment/service.yaml |  sed 's/\$VERSION/'"$BUILD_ID"'/g' | kubectl create -f -
fi

export BlueVersion=$(kubectl get service osrm -o=jsonpath='{.spec.selector.version}') #find deployed version
cat ./deployment/osrm.yaml | sed 's/\$VERSION/'"$BUILD_ID"'/g' | kubectl create -f - #Deploy new version
kubectl rollout status deployment/osrm-$BUILD_ID-deployment #Health Check
kubectl get service osrm -o=yaml | sed -e "s/$BlueVersion/$BUILD_ID/g" | kubectl apply -f - #Update Service YAML with Green version

if $DELETE_EXISTING
then
    kubectl delete deployment osrm-$BlueVersion-deployment #Delete blue version
fi