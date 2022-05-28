APPLICATION = lwbr
RIOTBASE ?= $(CURDIR)/../../RIOT
RIOTTOOLS ?= $(RIOTBASE)/dist/tools

BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800004672
PORT ?= /dev/ttyACM0

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ztimer
USEMODULE += ztimer_sec

USEMODULE += gnrc_sixlowpan_default
USEMODULE += gnrc_nettype_udp
USEMODULE += gnrc_udp
USEMODULE += gnrc_ipv6
#USEMODULE += gnrc_sixlowpan
#USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default

# BR setup
USEMODULE += stdio_ethos
CFLAGS += '-DETHOS_UART=UART_DEV(0)' -DETHOS_BAUDRATE=115200

.PHONY: start_network setup_network

# Use this if you want to open a shell with the br
start_network:
	$(RIOTTOOLS)/ethos/start_network.sh $(PORT) tap0 2001:db8::/64

# Use this if you want to have a connection but not a shell, e.g. for starting a debugger
setup_network:
	$(RIOTTOOLS)/ethos/start_network.sh tap0 2001:db8::/64

include $(RIOTBASE)/Makefile.include
