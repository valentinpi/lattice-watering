APPLICATION = lwfw
RIOTBASE ?= $(CURDIR)/../../RIOT

BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800001974
include ../Makefile.vars

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

# general
USEMODULE += credman
USEMODULE += credman_load
USEMODULE += periph_adc
USEMODULE += periph_gpio
USEMODULE += periph_wdt
USEMODULE += prng_sha256prng
USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ztimer
USEMODULE += ztimer_sec
USEPKG += nanocbor

# net and security
USEMODULE += tinydtls_sock_dtls
USEMODULE += gcoap_dtls
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
CFLAGS += -DCONFIG_DTLS_PSK

include $(RIOTBASE)/Makefile.include
