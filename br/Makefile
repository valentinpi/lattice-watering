APPLICATION = lwbr
RIOTBASE ?= $(CURDIR)/../../RIOT
RIOTTOOLS ?= $(RIOTBASE)/dist/tools

BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800004672
PORT ?= /dev/ttyACM0
include ../Makefile.vars

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

# general
USEMODULE += periph_wdt
USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ztimer
USEMODULE += ztimer_sec

# net
USEMODULE += gnrc_icmpv6_echo
USEMODULE += gnrc_sixlowpan_router_default
USEMODULE += auto_init_gnrc_rpl
USEMODULE += gnrc_rpl
USEMODULE += gnrc_ipv6_router_default
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default
CFLAGS += -DCONFIG_GNRC_IPV6_NIB_ARSM=1 -DCONFIG_GNRC_IPV6_NIB_SLAAC=1 -DCONFIG_GNRC_IPV6_NIB_NUMOF=16

# ethos
USEMODULE += stdio_ethos
CFLAGS += '-DETHOS_UART=UART_DEV(0)' -DETHOS_BAUDRATE=115200

.PHONY: ethos

# Start the ethernet over serial connection
ethos:
	bash -c    "trap 'ip tuntap del tap0 mode tap' EXIT; \
				ip tap add mode tap tap0; \
				ip link set tap0 up; \
				ip addr add $(HOST_IP_ADDR)/64 dev tap0; \
				ip route add $(SIX_IP_PREFIX)/64 via $(ETH_IP_ADDR); \
				$(RIOTTOOLS)/ethos/ethos tap0 $(PORT)"

include $(RIOTBASE)/Makefile.include
