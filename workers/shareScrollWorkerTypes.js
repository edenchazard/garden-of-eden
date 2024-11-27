import { z } from 'zod';
export const defaultPalette = {
    default: {
        labelColour: '#dff6f5',
        valueColour: '#f2bd59',
        usernameColour: '#dff6f5',
    },
    christmas: {
        labelColour: '#ffffff',
        valueColour: '#94edff',
        usernameColour: '#ffffff',
    },
};
const hexValue = z.string().regex(/^#[0-9a-f]{6}$/);
export const querySchema = z
    .object({
    ext: z.union([z.literal('.gif'), z.literal('.webp')]).default('.gif'),
    stats: z
        .union([z.literal('dragons'), z.literal('garden')])
        .default('garden'),
    style: z
        .union([z.literal('default'), z.literal('christmas')])
        .default('default'),
    usernameColour: hexValue.optional(),
    labelColour: hexValue.optional(),
    valueColour: hexValue.optional(),
})
    .transform((data) => ({
    ...defaultPalette[data.style],
    ...data,
}));
