for entry in `find test/docker -type f`; do
    echo $entry
    docker-compose -f $entry down --volumes
done

docker volume prune -f # remove all volumes

rm -r test/organizations/*