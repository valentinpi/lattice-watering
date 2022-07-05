APPLICATION = lwbr
RIOTBASE ?= $(CURDIR)/../../RIOT
RIOTTOOLS ?= $(RIOTBASE)/dist/tools

TAP ?= tap0
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
USEMODULE += gnrc_sixlowpan_router_default
USEMODULE += auto_init_gnrc_rpl
USEMODULE += gnrc_rpl
USEMODULE += gnrc_icmpv6_echo
USEMODULE += gnrc_ipv6_router_default
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default
CFLAGS += -DCONFIG_GNRC_IPV6_NIB_SLAAC=1

# ethos
USEMODULE += stdio_ethos
CFLAGS += '-DETHOS_UART=UART_DEV(0)' -DETHOS_BAUDRATE=115200

.PHONY: ethos

# Start the ethernet over serial connection
ethos:
	bash -c    "trap 'ip tuntap del $(TAP) mode tap' EXIT; \
				ip tap add mode tap $(TAP); \
				ip link set $(TAP) up; \
				ip addr add $(HOST_IP_ADDR)/64 dev $(TAP); \
				ip route add $(SIX_IP_PREFIX)/64 dev $(TAP) via $(BR_ETH_IP_ADDR); \
				$(RIOTTOOLS)/ethos/ethos $(TAP) $(PORT)"

include $(RIOTBASE)/Makefile.include
