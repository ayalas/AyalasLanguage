import { StyleSheet, useColorScheme } from 'react-native'

export default function useTextStyles() {
    const PRIMARY_LIGHT = '#1f2937';
    const PRIMARY_DARK = '#f3f4f6';
    const DIMMED_LIGHT = '#5f6470';
    const DIMMED_DARK = '#b8bfcc';
    const ERROR_LIGHT = '#b91c1c';
    const ERROR_DARK = '#ff6b6b';
    const ACCENT_LIGHT = '#7c3aed';
    const ACCENT_DARK = '#c084fc';

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const fontFamily = "Tajawal, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const styles = StyleSheet.create({
        h1: {
            fontFamily: fontFamily,
            fontSize: 26, fontWeight: '600',
            marginTop: 24,
            marginHorizontal: 0,
            marginBottom: 14
        },
        h2: {
            fontFamily: fontFamily,
            fontSize: 24, 
            fontWeight: '600',
            marginTop: 0,
            marginHorizontal: 0,
            marginBottom: 8
        },
        text: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            alignContent: 'center',
            textAlign: 'left'
        },
        exerciseText: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 22,
            alignContent: 'center',
            fontWeight: '400'
        },
        inlineExercise: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 22,
            alignContent: 'center',
            paddingHorizontal: 5,
        },
        italicHeading: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            alignContent: 'center',
            fontStyle: 'italic',
            textAlign: 'left'
        },
        dimmedText: {
            fontFamily: fontFamily,
            color: isDark ? DIMMED_DARK : DIMMED_LIGHT,
            fontSize: 18,
            alignContent: 'center',
            textAlign: 'left'
        },
        label: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            flexWrap: 'nowrap',
            alignContent: 'center',
            fontWeight: '500',
            textAlign: 'left'
        },
        labelWrap: {
            fontFamily: fontFamily,
            color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
            fontSize: 18,
            flexWrap: 'wrap',
            alignContent: 'center',
            fontWeight: '500',
            textAlign: 'left'
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
        colorAccent: {
            color: isDark? ACCENT_DARK : ACCENT_LIGHT
        },
        underline: { textDecorationLine: 'underline' }
    });
    return styles;
}