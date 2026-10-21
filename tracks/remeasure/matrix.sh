#!/bin/sh
# usage: cd tracks/remeasure/<rcNN> && sh ../matrix.sh production|development
# One process per cell (hard 40s kill) so a non-converging render cannot starve the next one.
M=${1:-production}
echo "# $(basename "$PWD") $M"
for shape in hole show for fn-hole-lazy errored-retry; do
  for kind in promise iterable query liveQuery; do
    out=$(BUILD_MODE=$M ONLY=$shape/$kind/stream perl -e 'alarm 40; exec @ARGV' bun ../run.ts 2>&1 | grep -E '^\{' | head -1)
    [ -n "$out" ] || out="{\"shape\":\"$shape\",\"kind\":\"$kind\",\"result\":\"HUNG (process killed after 40s, event loop starved)\"}"
    echo "$out"
  done
done
