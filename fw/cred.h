#pragma once

unsigned char cred_private_der[] = {
  0x30, 0x81, 0xdc, 0x02, 0x01, 0x01, 0x04, 0x42, 0x00, 0x78, 0x53, 0xcc,
  0x47, 0xf5, 0x68, 0xe5, 0x85, 0x67, 0x4e, 0x2f, 0x29, 0x25, 0x38, 0xe3,
  0x7f, 0x8d, 0xbc, 0x44, 0x16, 0x9b, 0xea, 0xa0, 0xc0, 0x10, 0x38, 0xe2,
  0xb7, 0x67, 0x85, 0xbb, 0xc7, 0x0c, 0xf0, 0xd8, 0x75, 0xa9, 0xd8, 0xc9,
  0x70, 0x6c, 0x33, 0x3b, 0xd3, 0xeb, 0x16, 0xd1, 0xa4, 0xc7, 0xf8, 0x45,
  0x0e, 0x49, 0x45, 0x5c, 0x44, 0x6a, 0xb5, 0xd8, 0xff, 0x74, 0x6c, 0xc2,
  0x6a, 0xf6, 0xa0, 0x07, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23, 0xa1,
  0x81, 0x89, 0x03, 0x81, 0x86, 0x00, 0x04, 0x00, 0xfb, 0xc4, 0x36, 0x99,
  0xe5, 0xc2, 0x34, 0x4e, 0x9b, 0x41, 0x30, 0x1b, 0xe3, 0xa1, 0x15, 0xa9,
  0xb4, 0x41, 0x66, 0x77, 0x5d, 0x1f, 0x36, 0xfa, 0x09, 0xd3, 0x51, 0xd7,
  0xb2, 0xf4, 0x6f, 0x4c, 0x60, 0xd9, 0x96, 0xcb, 0x3b, 0x1e, 0x78, 0xef,
  0x12, 0x03, 0x02, 0x2a, 0x25, 0xe1, 0x4a, 0x0d, 0xaf, 0x5d, 0x44, 0x76,
  0x2f, 0x25, 0xcf, 0x4c, 0xe8, 0x8f, 0x8e, 0x89, 0xa0, 0x07, 0x3b, 0xc3,
  0xd5, 0x01, 0x36, 0xae, 0xf3, 0x27, 0x29, 0x1e, 0xb1, 0x10, 0xf4, 0x8a,
  0x3f, 0x9f, 0x00, 0xc4, 0x31, 0x58, 0xce, 0xea, 0xa3, 0xb9, 0xd5, 0xc3,
  0xa1, 0xe8, 0x4a, 0x92, 0xf5, 0xa6, 0x62, 0x07, 0x73, 0xf3, 0xfc, 0x01,
  0x1b, 0x64, 0xfe, 0xc9, 0x1d, 0x2e, 0x02, 0x67, 0x70, 0xee, 0xdd, 0xd1,
  0xab, 0x8b, 0xf0, 0x36, 0x0d, 0x9c, 0xa8, 0x6a, 0xa0, 0x14, 0x0b, 0xdf,
  0x6d, 0xe8, 0x08, 0x46, 0xaa, 0x3d, 0xbf
};
unsigned int cred_private_der_len = 223;

unsigned char cred_public_der[] = {
  0x30, 0x81, 0x9b, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d,
  0x02, 0x01, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23, 0x03, 0x81, 0x86,
  0x00, 0x04, 0x00, 0xfb, 0xc4, 0x36, 0x99, 0xe5, 0xc2, 0x34, 0x4e, 0x9b,
  0x41, 0x30, 0x1b, 0xe3, 0xa1, 0x15, 0xa9, 0xb4, 0x41, 0x66, 0x77, 0x5d,
  0x1f, 0x36, 0xfa, 0x09, 0xd3, 0x51, 0xd7, 0xb2, 0xf4, 0x6f, 0x4c, 0x60,
  0xd9, 0x96, 0xcb, 0x3b, 0x1e, 0x78, 0xef, 0x12, 0x03, 0x02, 0x2a, 0x25,
  0xe1, 0x4a, 0x0d, 0xaf, 0x5d, 0x44, 0x76, 0x2f, 0x25, 0xcf, 0x4c, 0xe8,
  0x8f, 0x8e, 0x89, 0xa0, 0x07, 0x3b, 0xc3, 0xd5, 0x01, 0x36, 0xae, 0xf3,
  0x27, 0x29, 0x1e, 0xb1, 0x10, 0xf4, 0x8a, 0x3f, 0x9f, 0x00, 0xc4, 0x31,
  0x58, 0xce, 0xea, 0xa3, 0xb9, 0xd5, 0xc3, 0xa1, 0xe8, 0x4a, 0x92, 0xf5,
  0xa6, 0x62, 0x07, 0x73, 0xf3, 0xfc, 0x01, 0x1b, 0x64, 0xfe, 0xc9, 0x1d,
  0x2e, 0x02, 0x67, 0x70, 0xee, 0xdd, 0xd1, 0xab, 0x8b, 0xf0, 0x36, 0x0d,
  0x9c, 0xa8, 0x6a, 0xa0, 0x14, 0x0b, 0xdf, 0x6d, 0xe8, 0x08, 0x46, 0xaa,
  0x3d, 0xbf
};
unsigned int cred_public_der_len = 158;
