import { StorableValueType } from '../types';

export function getStorableTypeAndValue(
  value: any
): {
  type: StorableValueType;
  value: any;
} {
  switch (typeof value) {
    case 'object':
      // Keep Date objects as timestamps
      if (value instanceof Date) {
        return {
          type: StorableValueType.DATE,
          value: value.getTime(),
        };
      }
      // Keep RegExp objects as strings
      if (value instanceof RegExp) {
        return {
          value: String(value),
          type: StorableValueType.REGEXP,
        };
      }
      // Otherwise keep them as JSON
      return {
        type: StorableValueType.OTHER,
        value: JSON.stringify(value),
      };

    case 'function':
      return {
        value,
        type: StorableValueType.FUNCTION,
      };

    case 'number':
      return {
        value,
        type: StorableValueType.NUMBER,
      };

    case 'boolean':
      return {
        value: Boolean(value),
        type: StorableValueType.BOOLEAN,
      };

    case 'string':
    default:
      return {
        value,
        type: StorableValueType.STRING,
      };
  }
}
