APPLICATION = lwproxy
RIOTBASE ?= $(CURDIR)/../../RIOT

BOARD ?= native
PORT ?= tap1

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

# general
USEMODULE += credman
USEMODULE += credman_load
USEMODULE += prng_sha256prng
USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ztimer
USEMODULE += ztimer_sec

# net and security
USEMODULE += tinydtls_sock_dtls
USEMODULE += gnrc_sock_udp
USEMODULE += netstats_ipv6
USEMODULE += gnrc_netif_ipv6
USEMODULE += gnrc_icmpv6_echo
USEMODULE += gnrc_ipv6_default
USEMODULE += gnrc_rpl
USEMODULE += auto_init_gnrc_rpl
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default
CFLAGS += -DCONFIG_DTLS_ECC

.PHONY: cred

cred:
	just gen_keys

# Proxy tap interface
proxy:
	bash -c    "trap 'ip tuntap del tap1 mode tap' EXIT; \
				ip tap add mode tap tap1; \
				ip link set tap1 up; \
				while true; do sleep 1; done"

include $(RIOTBASE)/Makefile.include
