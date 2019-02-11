cat /src/copy-data.yaml | sed 's/\$BUILD_ID/'"$BUILD_ID"'/g' | kubectl create -f -

until kubectl describe pod copy-osrm-data-$BUILD_ID | sed -n 's/Status:\s*//gp' | grep -m 1 "Succeeded"
do
    sleep 1
done

echo "files copied"

cat /src/copy-data.yaml | sed 's/\$BUILD_ID/'"$BUILD_ID"'/g' | kubectl delete -f -