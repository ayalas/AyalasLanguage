decimal GetNextFraction(decimal input, bool up)
    {
        // 1. Extract the scale (number of decimal places) from the decimal
        // decimal.GetBits returns 4 ints. The 4th int contains the scale.
        int[] bits = decimal.GetBits(input);
        int scale = (bits[3] >> 16) & 0x7F;

        // 2. We want to add a '1' at the next decimal place (scale + 1)
        // C# decimals support up to 28-29 decimal places.
        if (scale >= 28)
            throw new OverflowException("Decimal precision limit reached.");

        // 3. Create a decimal that represents 10^-(scale + 1)
        // The constructor parameters are: (low, mid, high, isNegative, scale)
        decimal increment = new decimal(1, 0, 0, false, (byte)(scale + 1));

        if (up)
            return input + increment;
        else
            return input - increment;
    }
decimal GetNextFractionWithParse(decimal input, bool up)
    {
        // This trick removes trailing zeros
        input = decimal.Parse(input.ToString("G29"));
        // 1. Extract the scale (number of decimal places) from the decimal
        // decimal.GetBits returns 4 ints. The 4th int contains the scale.
        int[] bits = decimal.GetBits(input);
        int scale = (bits[3] >> 16) & 0x7F;

        // 2. We want to add a '1' at the next decimal place (scale + 1)
        // C# decimals support up to 28-29 decimal places.
        if (scale >= 28)
            throw new OverflowException("Decimal precision limit reached.");

        // 3. Create a decimal that represents 10^-(scale + 1)
        // The constructor parameters are: (low, mid, high, isNegative, scale)
        decimal increment = new decimal(1, 0, 0, false, (byte)(scale + 1));

        if (up)
            return input + increment;
        else
            return input - increment;
    }

decimal input = 1.000000000000000000000000000m;

Console.WriteLine($"GetNextFraction: {GetNextFraction(input, false)}");
Console.WriteLine($"GetNextFractionWithParse: {GetNextFractionWithParse(input, false)}");


