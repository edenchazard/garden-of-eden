import { z } from 'zod';
const defaultPalette = {
    default: {
        labelColour: 'dff6f5',
        valueColour: 'f2bd59',
        usernameColour: 'dff6f5',
    },
    christmas: {
        labelColour: 'ffffff',
        valueColour: '17d9ff',
        usernameColour: 'ffffff',
    },
};
const hexValue = z.string().length(6);
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
    .transform((data) => {
    if (data.labelColour === undefined) {
        data.labelColour = defaultPalette[data.style].labelColour;
    }
    if (data.valueColour === undefined) {
        data.valueColour = defaultPalette[data.style].valueColour;
    }
    if (data.usernameColour === undefined) {
        data.usernameColour = defaultPalette[data.style].usernameColour;
    }
    return data;
});
