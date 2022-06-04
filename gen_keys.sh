#!/usr/bin/sh

# Simple script to create a keypair in the current directory.

mkdir cert
cd cert
openssl ecparam -name secp521r1 -genkey -out private.der -outform DER
openssl ec -in private.der -pubout -out public.der -inform DER -outform DER
xxd -i private.der
xxd -i public.der
cd ..
rm -rf cert
