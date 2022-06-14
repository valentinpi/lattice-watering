update_riotos:
    #!/usr/bin/sh
    cd ~/dev/RIOT
    git pull

gen_keys:
    #!/usr/bin/sh
    mkdir cert
    cd cert
    openssl ecparam -name secp521r1 -genkey -outform DER -out private.der
    openssl ec -inform DER -in private.der -outform PEM -out private.pem
    openssl ec -inform DER -in private.der -pubout -outform DER -out public.der
    openssl ec -inform PEM -in private.pem -pubout -outform PEM -out public.pem
    touch summary.txt
    cat private.pem >> summary.txt
    xxd -i private.der >> summary.txt
    cat public.pem >> summary.txt
    xxd -i public.der >> summary.txt
    cd ..
