for entry in `find test/docker -type f`; do
    echo $entry
    docker-compose -f $entry down
done


rm -r test/organizations/*