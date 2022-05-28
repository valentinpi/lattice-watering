APPLICATION = lwfw
BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800001974
RIOTBASE ?= $(CURDIR)/../../RIOT

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands

USEMODULE += gnrc_nettype_udp
USEMODULE += gnrc_udp
USEMODULE += gnrc_ipv6
#USEMODULE += gnrc_sixlowpan
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default

include $(RIOTBASE)/Makefile.include
