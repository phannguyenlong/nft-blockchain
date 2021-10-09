for entry in `ls test/docker`; do
    docker-compose -f test/docker/$entry down
done


rm -r test/organizations/*