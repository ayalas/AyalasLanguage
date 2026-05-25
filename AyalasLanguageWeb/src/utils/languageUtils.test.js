import { describe, it, expect } from 'vitest';
import { replaceCharsForLanguage } from './languageUtils'; // Adjust this path to your actual file

describe('replaceCharsForLanguage', () => {
    
    describe('Danish & Norwegian', () => {
        it('should replace lowercase digraphs', () => {
            expect(replaceCharsForLanguage('Dansk', 'paa oeble saeon')).toBe('på øble sæon');
            expect(replaceCharsForLanguage('norsk', 'paa oeble saeon')).toBe('på øble sæon');
        });

        it('should handle Titlecase and Uppercase digraphs', () => {
            expect(replaceCharsForLanguage('Dansk', 'Aarhus')).toBe('Århus');
            expect(replaceCharsForLanguage('Dansk', 'AARHUS')).toBe('ÅRHUS');
            expect(replaceCharsForLanguage('Dansk', 'Oen')).toBe('Øn');
            expect(replaceCharsForLanguage('Dansk', 'Aerskoebing')).toBe('Ærskøbing');
        });
    });

    describe('German', () => {
        it('should replace German umlauts (ae, oe, ue)', () => {
            expect(replaceCharsForLanguage('Deutsch', 'koennen fuer kaese')).toBe('können für käse');
        });

        it('should handle uppercase German umlauts', () => {
            expect(replaceCharsForLanguage('Deutsch', 'Oel')).toBe('Öl');
            expect(replaceCharsForLanguage('Deutsch', 'Ueber')).toBe('Über');
            expect(replaceCharsForLanguage('Deutsch', 'AERZTE')).toBe('ÄRZTE');
        });
    });

    describe('Swedish & Finnish', () => {
        it('should replace aa, ae, oe for Swedish/Finnish', () => {
            expect(replaceCharsForLanguage('svenska', 'kaar saeng oea')).toBe('kår säng öa');
        });
    });

    describe('Icelandic', () => {
        it('should replace th and dh alongside ae', () => {
            expect(replaceCharsForLanguage('islandska', 'Thoersmork')).toBe('Þórsmork');
            expect(replaceCharsForLanguage('islandska', 'faedha')).toBe('fæða');
        });
    });

    describe('Edge Cases & Fallbacks', () => {
        it('should be case-insensitive regarding the language name argument', () => {
            expect(replaceCharsForLanguage('dAnSk', 'aa')).toBe('å');
            expect(replaceCharsForLanguage('DEUTSCH', 'ue')).toBe('ü');
        });

        it('should return the original string if the language is not supported', () => {
            expect(replaceCharsForLanguage('English', 'The weather is nice.')).toBe('The weather is nice.');
        });

        it('should handle empty or null strings gracefully', () => {
            expect(replaceCharsForLanguage('Dansk', '')).toBe('');
            expect(replaceCharsForLanguage('Dansk', null)).toBe(null);
        });

        it('should leave unrelated text untouched', () => {
            expect(replaceCharsForLanguage('Dansk', 'hello world 123!')).toBe('hello world 123!');
        });
    });
});