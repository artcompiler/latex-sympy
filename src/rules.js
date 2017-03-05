export var rules={"words":{},"types":{"functionName":["f","g","h","F","G","H","\\ln","\\lg","\\log","\\sin","\\cos","\\tan","\\csc","\\sec","\\cot","\\sinh","\\cosh","\\tanh","\\csch","\\sech","\\coth"],"numberPosNeg":["\\type{number}","-\\type{number}"],"numberOrLetter":["\\type{numberPosNeg}","\\type{variable}"],"matrix":["\\begin{bmatrix}?&?&?\\end{bmatrix}"],"functionComposition":["(\\type{functionName}+\\type{functionName})","(\\type{functionName}-\\type{functionName})","(\\type{functionName}\\cdot\\type{functionName})","(\\frac{\\type{functionName}}{\\type{functionName}})"],"function":["\\type{function}^{?}","\\type{function}_{?}","\\type{functionComposition}","\\type{functionName}"],"functionCall":["\\type{function}(?)","\\type{function}[?]","\\type{variable}(\\type{number})","\\type{variable}(\\type{variable})","\\type{variable}(?,?)","\\type{variable}[\\type{number}]","\\type{variable}[\\type{variable}]","\\type{variable}[?,?]"],"commonFraction":["\\frac{\\type{integer}}{2}","\\frac{\\type{integer}}{3}","\\frac{\\type{integer}}{4}","\\frac{\\type{integer}}{5}","\\frac{\\type{integer}}{6}","\\frac{\\type{integer}}{7}","\\frac{\\type{integer}}{8}","\\frac{\\type{integer}}{9}","\\frac{\\type{integer}}{10}"],"simpleExpression":["\\type{numberOrLetter}","\\type{commonFraction}","\\type{function}(?)","\\type{function}[?]","\\type{number}","-\\type{variable}","\\type{variable}","\\type{number}\\degrees","\\type{variable}\\degrees","\\type{variable}","\\type{variable}\\type{variable}","\\type{number}\\type{variable}"],"simpleFractionPart":["-\\type{commonFraction}","\\type{simpleExpression}","\\type{commonFraction}"],"simpleFractionExtended":["\\frac{\\type{simpleFractionPart}}{\\type{simpleFractionPart}}"],"simpleNumericExponent":["\\type{number}","\\type{commonFraction}"],"simpleExponent":["\\type{simpleNumericExponent}","\\type{variable}"]},"rules":{"\\frac{\\type{number}}{\\type{number}}":["Rational(%1,%2)"],"\\frac{?}{?}":["(%1/%2)"],"?^?":["%1**%2"],"\\sqrt{?}":["sqrt(%1)"],"\\sqrt[?]{?}":["root(%2,%1)"],"-?":["-%1"],"?\\degree":["radians(%1)"],"\\sin{?}":["sin(%2)"],"\\cos{?}":["cos(%2)"],"\\tan{?}":["tan(%2)"],"\\csc{?}":["csc(%2)"],"\\sec{?}":["sec(%2)"],"\\cot{?}":["cot(%2)"],"\\sin^{-1}{?}":["asin(%2)"],"\\cos^{-1}{?}":["acos(%2)"],"\\tan^{-1}{?}":["atan(%2)"],"\\csc^{-1}{?}":["acsc(%2)"],"\\sec^{-1}{?}":["asec(%2)"],"\\cot^{-1}{?}":["acot(%2)"],"\\sinh^{-1}{?}":["sinh(%2)"],"\\cosh^{-1}{?}":["cosh(%2)"],"\\tanh^{-1}{?}":["tanh(%2)"],"\\csch^{-1}{?}":["csch(%2)"],"\\sech^{-1}{?}":["sech(%2)"],"\\acoth^{-1}{?}":["acoth(%2)"],"\\asinh^{-1}{?}":["asinh(%2)"],"\\acosh^{-1}{?}":["acosh(%2)"],"\\atanh^{-1}{?}":["atanh(%2)"],"\\acsch^{-1}{?}":["acsch(%2)"],"\\asech^{-1}{?}":["asech(%2)"],"\\type{mixedFraction}":["(%1+%2)"],"\\type{integer}+\\frac{\\type{integer}}{\\type{integer}}":["(%1+%2)"],"\\type{scientific}":["(%1*%2)"],"\\type{fraction}":["(%1/%2)"],"\\type{integer}":["%1"],"\\type{decimal}":["%IP.%FP"],"\\type{number}":["%1"],"?(?)":["(%1*%2)"],"(?)?":["(%1*%2)"],"(?)(?)":["(%1*%2)"],"?+?":["(%1+%2)"],"?-?":["(%1-%2)"],"?*?":["(%1*%2)"],"?\\cdot?":["(%1*%2)"],"?\\cdotp?":["(%1*%2)"],"?\\div?":["Rational(%1,%2)"],"?<?":["Lt(%1,%2)"],"?<=?":["Le(%1,%2)"],"?>?":["Gt(%1,%2)"],"?>=?":["Ge(%1,%2)"],"?=?":["Eq(%1,%2)"],"?\\ne?":["Ne(%1,%2)"],"?\\neq?":["Ne(%1,%2)"],"?^? ?":["(%1*%2)"],"? ?^?":["(%1*%2)"],"(\\type{simpleExpression})":["%1"],"[?]":["(%1)"],"{?} ?":["(%1*%2)"],"(?)":["(%1)"],"{?}":["(%1)"],"? ?":["(%1*%2)"],"?":["%1"]}}