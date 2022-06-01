APPLICATION = lwbr
RIOTBASE ?= $(CURDIR)/../../RIOT
RIOTTOOLS ?= $(RIOTBASE)/dist/tools

BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800004672
PORT ?= /dev/ttyACM0
HOST_IP_ADDR ?= fc00::0
BR_IP_ADDR ?= fc00::1
CFLAGS += '-DHOST_IP_ADDR="$(HOST_IP_ADDR)"' '-DBR_IP_ADDR="$(BR_IP_ADDR)"' # Both host and router add these unique adresses

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

# general
USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ztimer
USEMODULE += ztimer_sec
USEPKG += nanocbor

# net
USEMODULE += gcoap
USEMODULE += gnrc_icmpv6_echo
USEMODULE += gnrc_ipv6_default # Automatically includes 6LoWPAN functionality
USEMODULE += gnrc_ipv6_nib_6lbr
USEMODULE += gnrc_ndp
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default
CFLAGS += -DCONFIG_GNRC_IPV6_NIB_ARSM=1 -DCONFIG_GNRC_IPV6_NIB_SLAAC=1 -DCONFIG_GNRC_IPV6_NIB_NUMOF=16

# br setup
USEMODULE += stdio_ethos
CFLAGS += '-DETHOS_UART=UART_DEV(0)' -DETHOS_BAUDRATE=115200

.PHONY: start_network setup_network
.INTERMEDIATE: ethos_cleanup

# Start the ethernet over serial connection
ethos:
	bash -c    "trap 'ip tuntap del tap0 mode tap' EXIT; \
				ip tap add mode tap tap0; \
				ip link set tap0 up; \
				ip addr add fe80::0/64 dev tap0; \
				ip addr add fc00::0 dev tap0; \
				$(RIOTTOOLS)/ethos/ethos tap0 $(PORT)"

include $(RIOTBASE)/Makefile.include
