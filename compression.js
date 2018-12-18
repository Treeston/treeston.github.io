const BITS_PER_CHAR = 8;
const BITS_PER_CARD_CODE = 27;
const BITS_PER_CARD_COUNT = 2;

let isDecompressedDeckData = function(data) { return ((!(data.length%9)) && /^\d+$/.test(data)); };

function CompressDeckData(data)
{
    if (!isDecompressedDeckData(data))
        throw 'Internal error - invalid deck data';
    
    var raw = '';
    
    var currentCardIndex = 0;
    var nextBitInInput = 0;
    var outputCharCode = 0;
    var nextBitInOutput = 0;
    while (currentCardIndex < data.length)
    {
        var currentCardNumData = ((parseInt(data.substring(currentCardIndex,currentCardIndex+8)) << BITS_PER_CARD_COUNT) | Math.min(parseInt(data.substring(currentCardIndex+8,currentCardIndex+9)),(1 << BITS_PER_CARD_COUNT)-1));
        var bitsToWrite = Math.min(BITS_PER_CHAR - nextBitInOutput, (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - nextBitInInput);
        if (nextBitInInput)
            currentCardNumData &= (1 << ((BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - nextBitInInput))-1;
        if (nextBitInInput + bitsToWrite < BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT)
            currentCardNumData >>= ((BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - (nextBitInInput + bitsToWrite));
        if (nextBitInOutput + bitsToWrite < BITS_PER_CHAR)
            currentCardNumData <<= (BITS_PER_CHAR - (nextBitInOutput + bitsToWrite));
        outputCharCode |= currentCardNumData;
        if ((nextBitInOutput += bitsToWrite) == BITS_PER_CHAR)
        {
            raw += String.fromCharCode(outputCharCode);
            outputCharCode = 0;
            nextBitInOutput = 0;
        }
        if ((nextBitInInput += bitsToWrite) == (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT))
        {
            currentCardIndex += 9;
            nextBitInInput = 0;
        }
    }
    if (nextBitInOutput)
        raw += String.fromCharCode(outputCharCode);
    
    var compressed = btoa(raw);
    while (isDecompressedDeckData(compressed)) // padding
        compressed = btoa(raw = (String.fromCharCode(0) + raw));
        
    return compressed;
}

function DecompressDeckData(data)
{
    if (!data || !data.length || isDecompressedDeckData(data))
        return data; // data is not compressed (old URL)
    
    var raw = atob(data);
    var decompressed = '';
    
    var nextCharacterIndex = 0;
    while (raw.charCodeAt(nextCharacterIndex) == 0) // potential padding
        ++nextCharacterIndex;
    var nextBitInCharacter = 0;
    
    var readCardData = 0;
    var nextBitInOutput = 0;
    while (nextCharacterIndex < raw.length)
    {
        var charAtIndex = raw.charCodeAt(nextCharacterIndex);
        var bitsToRead = Math.min(BITS_PER_CHAR - nextBitInCharacter, (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - nextBitInOutput);
        if (nextBitInCharacter)
            charAtIndex &= (1 << (BITS_PER_CHAR - nextBitInCharacter))-1;
        if (nextBitInCharacter + bitsToRead < BITS_PER_CHAR)
            charAtIndex >>= (BITS_PER_CHAR - (nextBitInCharacter + bitsToRead));
        if (nextBitInOutput + bitsToRead < (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT))
            charAtIndex <<= ((BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - (nextBitInOutput + bitsToRead));
        readCardData |= charAtIndex;
        if ((nextBitInOutput += bitsToRead) == (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT))
        {
            var cardCode = readCardData >> BITS_PER_CARD_COUNT;
            var cardCount = readCardData & ((1 << BITS_PER_CARD_COUNT)-1);
            decompressed += cardCode;
            decompressed += cardCount;
            
            readCardData = 0;
            nextBitInOutput = 0;
        }
        if ((nextBitInCharacter += bitsToRead) == BITS_PER_CHAR)
        {
            ++nextCharacterIndex;
            nextBitInCharacter = 0;
        }
    }
    
    return decompressed;
}