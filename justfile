# Warning: Only works with specific configurations. E.g. with the default nftables config.
#          On my system (Valentin), this rule always gets reset, so I implemented this small command.
open_firewall:
    #!/usr/bin/sh
    sudo nft add rule inet filter input position 9 udp dport 5684 accept
    #sudo nft add rule inet filter input position 9 udp dport 5683 accept

# Slightly hardcoded script for `cred.rs` generation
gen_psk:
    #!/usr/bin/bash
    rm -rf psk
    mkdir psk
    cd psk
    pwgen -cnsy 32 1 > psk_key
    tr --delete '\n' < psk_key > tmp
    mv tmp psk_key
    xxd -i psk_key > psk_key.h
    sed -i 's/unsigned[ ]char/const uint8_t/' psk_key.h
    sed -i 's/unsigned[ ]int/const size_t/' psk_key.h
    sed -i 's/psk_key/PSK_KEY/' psk_key.h
    sed -i 's/len/LEN/' psk_key.h
    cd ..
    clang-format -i psk/psk_key.h
    cd psk
    cp psk_key.h psk_key.rs
    sed -i '4d' psk_key.rs
    sed -i 's/const[ ]uint8_t[ ]PSK_KEY\[\][ ]=[ ]{/pub const PSK_KEY: [u8; 32] = [/' psk_key.rs
    sed -i 's/}/]/' psk_key.rs
    mv psk_key.h ../fw
    mv psk_key.rs ../proxy/src

