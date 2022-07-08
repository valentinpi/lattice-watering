APPLICATION = lwfw
RIOTBASE ?= $(CURDIR)/../../RIOT

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
#USEMODULE += prng_sha256prng
USEMODULE += prng_sha1prng
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
USEMODULE += gnrc_icmpv6_error
USEMODULE += gnrc_ipv6_default
USEMODULE += gnrc_rpl
USEMODULE += auto_init_gnrc_rpl
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default
CFLAGS += -DCONFIG_DTLS_PSK

# NOTE: To fix weird timing issue: When trying to send the handshake, the timeout is just far too slow.
#       We use 10 seconds.
CFLAGS += -DCONFIG_GCOAP_DTLS_HANDSHAKE_TIMEOUT_MSEC=30000
# NOTE: We do not run a DTLS server on the nodes and we only connect to the proxy, so we can safely deactivate
#       this, avoiding constantly closing and reopening the existing session.
CFLAGS += -DCONFIG_GCOAP_DTLS_MINIMUM_AVAILABLE_SESSIONS=0


include $(RIOTBASE)/Makefile.include
