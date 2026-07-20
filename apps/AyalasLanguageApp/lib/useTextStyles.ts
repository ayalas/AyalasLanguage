import { ACCENT_DARK, ACCENT_LIGHT } from '@/constants';
import { StyleSheet, useColorScheme } from 'react-native'

export default function useTextStyles() {
    const PRIMARY_LIGHT = '#1f2937';
    const PRIMARY_DARK = '#f3f4f6';
    const DIMMED_LIGHT = '#5f6470';
    const DIMMED_DARK = '#b8bfcc';
    const ERROR_LIGHT = '#b91c1c';
    const ERROR_DARK = '#ff6b6b';
    const BG_ALTER_DARK = '#1b2029';
    const BG_ALTER_LIGHT = '#e2d3dd';
 /*    const SURFACE_STRONG_DARK = '#171b24';
    const SURFACE_STRONG_LIGHT = '#ffffff'; */

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const fontFamily = "Tajawal, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const styles = StyleSheet.create({
        h1: {
            fontFamily: fontFamily,
            fontSize: 26, fontWeight: '600',
            marginTop: 24,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            marginHorizontal: 0,
            marginBottom: 14
        },
        h2: {
            fontFamily: fontFamily,
            fontSize: 24, 
            fontWeight: '600',
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            marginTop: 0,
            marginHorizontal: 0,
            marginBottom: 8
        },
        text: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            alignContent: 'center',
            textAlign: 'left',
            flexDirection: 'row',
            alignSelf: 'flex-start'
        },
        exerciseText: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 22,
            alignContent: 'center',
            fontWeight: '400',
            flexDirection: 'row',
            alignSelf: 'flex-start'
        },
        inlineExercise: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 22,
            alignContent: 'center',
            paddingHorizontal: 5,
            flexDirection: 'row',
            alignSelf: 'flex-start'
        },
        italicHeading: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            alignContent: 'center',
            fontStyle: 'italic',
            textAlign: 'left',
            flexDirection: 'row',
            alignSelf: 'flex-start'
        },
        dimmedText: {
            fontFamily: fontFamily,
            color: isDark ? DIMMED_DARK : DIMMED_LIGHT,
            fontSize: 18,
            alignContent: 'center',
            textAlign: 'left',
            flexDirection: 'row',
            alignSelf: 'flex-start'
        },
        label: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            flexWrap: 'nowrap',
            alignContent: 'center',
            fontWeight: '500',
            textAlign: 'left',
            paddingBottom: 4,
            flexDirection: 'row',
            alignSelf: 'flex-start'
        },
        labelWrap: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            flexWrap: 'wrap',
            alignContent: 'center',
            fontWeight: '500',
            textAlign: 'left',
            flexDirection: 'row',
            alignSelf: 'flex-start',
        },
        errorText: {
            fontFamily: fontFamily,
            fontSize: 18,
            color: isDark ? ERROR_DARK : ERROR_LIGHT
        },
        doneCell: {
            color: '#374151',
            backgroundColor: '#e5e7eb'
        },
        errorCell: {
            color: 'white',
            backgroundColor: 'rgb(201, 157, 157)'
        },
        selectedCell: {
            color: 'white',
            backgroundColor: 'rgb(127, 222, 127)'
        },
        bgAlter: {
            backgroundColor: isDark ? BG_ALTER_DARK: BG_ALTER_LIGHT
        },
       /*  surfaceStrong: {
            backgroundColor: isDark ? SURFACE_STRONG_DARK: SURFACE_STRONG_LIGHT
        }, */
        colorAccent: {
            color: isDark? ACCENT_DARK : ACCENT_LIGHT
        },
        /* borderColor: {
            borderColor: isDark? BORDER_DARK : BORDER_WHITE
        }, */
        underline: { textDecorationLine: 'underline' }
    });
    return { styles, isDark };
}