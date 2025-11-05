import { Signal } from '@preact/signals-core';
export function resolveSignal(data) {
    return data instanceof Signal ? data.value : data;
}
//# sourceMappingURL=utils.js.map