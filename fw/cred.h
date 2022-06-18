#pragma once

unsigned char cred_private_der[] = {
  0x30, 0x81, 0xdc, 0x02, 0x01, 0x01, 0x04, 0x42, 0x00, 0xd8, 0x12, 0x74,
  0xdc, 0x4b, 0x18, 0x07, 0x0e, 0xf2, 0x78, 0xef, 0x17, 0xc9, 0xd7, 0xe9,
  0x03, 0x38, 0xf4, 0x45, 0x4d, 0x96, 0x57, 0x1a, 0x1f, 0x5c, 0xe2, 0x68,
  0x2f, 0x07, 0x43, 0x0e, 0xc9, 0x1e, 0x5d, 0xdf, 0xf7, 0xed, 0xaa, 0xeb,
  0xd9, 0xe5, 0x8e, 0x39, 0x07, 0x26, 0x6e, 0xa0, 0x2e, 0x75, 0x6c, 0x44,
  0x6d, 0x31, 0x5e, 0x37, 0xe0, 0x88, 0x1b, 0x50, 0xfe, 0x29, 0xbc, 0x7b,
  0x9d, 0xc9, 0xa0, 0x07, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23, 0xa1,
  0x81, 0x89, 0x03, 0x81, 0x86, 0x00, 0x04, 0x00, 0x6e, 0xb0, 0x77, 0xbc,
  0xa1, 0x8a, 0xda, 0x2f, 0x20, 0xe6, 0x77, 0xca, 0x79, 0xc2, 0x18, 0xae,
  0x12, 0xff, 0xf8, 0x4f, 0xa4, 0x0b, 0xa1, 0xc2, 0x7d, 0xfd, 0xb3, 0x37,
  0x18, 0x50, 0xcc, 0xce, 0xe3, 0x07, 0xb3, 0xe2, 0xb2, 0x44, 0x84, 0x14,
  0x83, 0x93, 0x36, 0xbd, 0x43, 0x6c, 0x33, 0x47, 0xd9, 0x5d, 0xd4, 0x03,
  0xe2, 0x71, 0xd3, 0xa0, 0x71, 0xa8, 0x99, 0xb6, 0xd7, 0xf4, 0x53, 0x0a,
  0x6e, 0x01, 0xff, 0xed, 0x1c, 0x04, 0x1b, 0x9c, 0x3b, 0x81, 0x80, 0xda,
  0xc0, 0xe7, 0xe9, 0x12, 0x5e, 0x6e, 0x38, 0xee, 0x1e, 0x0f, 0xbf, 0xa0,
  0x45, 0x04, 0x67, 0xe0, 0xff, 0x61, 0xf0, 0xd8, 0x8c, 0xaa, 0x58, 0xf5,
  0xd8, 0x0d, 0xc6, 0x27, 0x3c, 0x83, 0xb4, 0x9b, 0x4d, 0x2a, 0x01, 0x82,
  0x70, 0x10, 0xcd, 0xbe, 0xc0, 0x70, 0x73, 0x63, 0x11, 0xcd, 0x4d, 0xc6,
  0x70, 0x63, 0x27, 0x57, 0x28, 0x31, 0xd3
};
unsigned int cred_private_der_len = 223;

unsigned char cred_public_der[] = {
  0x30, 0x81, 0x9b, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d,
  0x02, 0x01, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23, 0x03, 0x81, 0x86,
  0x00, 0x04, 0x00, 0x6e, 0xb0, 0x77, 0xbc, 0xa1, 0x8a, 0xda, 0x2f, 0x20,
  0xe6, 0x77, 0xca, 0x79, 0xc2, 0x18, 0xae, 0x12, 0xff, 0xf8, 0x4f, 0xa4,
  0x0b, 0xa1, 0xc2, 0x7d, 0xfd, 0xb3, 0x37, 0x18, 0x50, 0xcc, 0xce, 0xe3,
  0x07, 0xb3, 0xe2, 0xb2, 0x44, 0x84, 0x14, 0x83, 0x93, 0x36, 0xbd, 0x43,
  0x6c, 0x33, 0x47, 0xd9, 0x5d, 0xd4, 0x03, 0xe2, 0x71, 0xd3, 0xa0, 0x71,
  0xa8, 0x99, 0xb6, 0xd7, 0xf4, 0x53, 0x0a, 0x6e, 0x01, 0xff, 0xed, 0x1c,
  0x04, 0x1b, 0x9c, 0x3b, 0x81, 0x80, 0xda, 0xc0, 0xe7, 0xe9, 0x12, 0x5e,
  0x6e, 0x38, 0xee, 0x1e, 0x0f, 0xbf, 0xa0, 0x45, 0x04, 0x67, 0xe0, 0xff,
  0x61, 0xf0, 0xd8, 0x8c, 0xaa, 0x58, 0xf5, 0xd8, 0x0d, 0xc6, 0x27, 0x3c,
  0x83, 0xb4, 0x9b, 0x4d, 0x2a, 0x01, 0x82, 0x70, 0x10, 0xcd, 0xbe, 0xc0,
  0x70, 0x73, 0x63, 0x11, 0xcd, 0x4d, 0xc6, 0x70, 0x63, 0x27, 0x57, 0x28,
  0x31, 0xd3
};
unsigned int cred_public_der_len = 158;
