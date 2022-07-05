# proxy - A DTLS Proxy

Due to practically nonexistent reliable support for creating DTLS servers in `node.js` at this time, we needed another solution. Existing DTLS proxies were gathered from the internet and tested, but none worked, so we wrote our own proxy using `tinydtls-rs`.

To use this proxy, you will need to open up the port 5684 on your machine. The `open_firewall` command in the `justfile` demonstrates this for the default `nftables` firewall on an Arch system at the time, you will need to adjust this to your liking. If you also use `nftables`, you can look into your existing rules and display their handles by executing:
```
# nft --handle list ruleset
```

To execute the proxy, assuming you have installed Rust e.g. via `rustup`, simply type:
```
$ cargo run --release
```
