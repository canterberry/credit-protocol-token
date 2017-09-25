#!/bin/bash
function cleanup {
    kill -9 $geth_pid
    rm -rf geth
}

trap cleanup EXIT

mkdir geth && mkdir geth/privchain
cat <<- EOF > geth/genesis.json
{
    "config": {
        "chainId": 15,
        "homesteadBlock": 0,
        "eip155Block": 0,
        "eip158Block": 0
    },
    "difficulty": "0x4000",
    "gasLimit": "2100000",
    "alloc": {
        "7df9a875a174b3bc565e6424a0050ebc1b2d1d82": { "balance": "300000" },
        "f41c74c9ae680c1aa78f42e5647a62f353b7bdde": { "balance": "400000" }
    }
}
EOF

geth --datadir geth/privchain init geth/genesis.json
geth --port 3000 --networkid 58342 --nodiscover --datadir="geth/privchain" --maxpeers=0 \
     --rpc --rpcport 8548 --rpcaddr 127.0.0.1 --rpccorsdomain "*" --rpcapi "eth,net,web3" &
geth_pid=$!
# truffle migrate --reset --network geth
geth attach ipc://Users/aupiff/1-work/blockmason/crowdsale-audit/tce-contracts/geth/privchain/geth.ipc
wait
