APPLICATION = lwfw
BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800008213
RIOTBASE ?= $(CURDIR)/../../Tutorials/RIOT

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEPKG += nanocbor

USEMODULE += gnrc_sixlowpan
USEMODULE += gnrc_nettype_ipv6
USEMODULE += gnrc_ipv6
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default

include $(RIOTBASE)/Makefile.include
