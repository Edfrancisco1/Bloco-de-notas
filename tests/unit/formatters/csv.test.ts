import { describe, expect, it } from 'vitest';
import { toCsv } from '@/lib/formatters/csv';

describe('toCsv', () => {
  it('escreve BOM, cabeçalho e linhas com CRLF', () => {
    const csv = toCsv(['nome', 'valor'], [['Depósito', '5000000']]);
    expect(csv).toBe('﻿nome,valor\r\nDepósito,5000000\r\n');
  });

  it('escapa vírgulas, aspas e quebras de linha; vazio para null', () => {
    const csv = toCsv(
      ['a', 'b', 'c'],
      [
        ['1, 2', 'diz "olá"', null],
        ['linha\nnova', true, 0],
      ],
    );
    expect(csv).toBe('﻿a,b,c\r\n"1, 2","diz ""olá""",\r\n"linha\nnova",true,0\r\n');
  });
});
