// useDoubleShiftDetector.ts
import {ref} from 'vue';

interface UseDoubleShiftDetectorParams {
    onDoubleShift: () => void;
    preventDefault?: boolean,
    threshold?: number;
}

export function useDoubleShiftDetector({
                                           onDoubleShift,
                                           threshold = 200,
                                           preventDefault = false
                                       }: UseDoubleShiftDetectorParams) {
    const lastShiftPressTime = ref<number>(0);
    const otherKeyPressed = ref<boolean>(false);

    function handleDoubleShiftKeyDown(event: KeyboardEvent): void {
        if (event.key !== 'Shift') {
            otherKeyPressed.value = true;
            return;
        }

        const currentTime = Date.now();
        if (otherKeyPressed.value || currentTime - lastShiftPressTime.value > threshold) {
            otherKeyPressed.value = false;
            lastShiftPressTime.value = currentTime;
            return;
        }

        onDoubleShift(); // Call the callback function
        lastShiftPressTime.value = 0;
        otherKeyPressed.value = false
        preventDefault && event.preventDefault();
    }

    return {handleDoubleShiftKeyDown};
}
