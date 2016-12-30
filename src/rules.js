export var rules={"words":{"A":"cap a","B":"cap b","C":"cap c","D":"cap d","E":"cap e","F":"cap f","G":"cap g","H":"cap h","I":"cap i","J":"cap j","K":"cap k","L":"cap l","M":"cap m","N":"cap n","O":"cap o","P":"cap p","Q":"cap q","R":"cap r","S":"cap s","T":"cap t","U":"cap u","V":"cap v","W":"cap w","X":"cap x","Y":"cap y","Z":"cap z","\\varepsilon":"epsilon","\\Alpha":"cap alpha","\\Beta":"cap beta","\\Gamma":"cap gamma","\\Delta":"cap delta","\\Epsilon":"cap epsilon","\\Zeta":"cap zeta","\\Eta":"cap eta","\\Theta":"cap theta","\\Iota":"cap iota","\\Kappa":"cap kappa","\\Lambda":"cap lambda","\\Mu":"cap mu","\\Nu":"cap nu ","\\Xi":"cap xi","\\Omicron":"cap omicron","\\Pi":"cap pi","\\Rho":"cap rho","\\Sigma":"cap sigma","\\Tau":"cap tau","\\Upsilon":"cap upsilon","\\Phi":"cap phi","\\Chi":"cap chi","\\Psi":"cap psi","\\Omega":"cap omega","\\ldots":"dot dot dot","\\vdots":"vertical dot dot dot","\\ddots":"diagonal dot dot dot","\\infty":"infinity","\\measuredangle":"measure of angle","\\cong":"congruent","\\sin":"sine","\\cos":"cosine","\\tan":"tangent","\\csc":"cosecant","\\sec":"secant","\\cot":"cotangent","\\sinh":"hyperbolic sine","\\cosh":"hyperbolic cosine","\\tanh":"hyperbolic tangent","\\csch":"hyperbolic cosecant","\\sech":"hyperbolic secant","\\coth":"hyperbolic cotangent","'":"prime","\\notin":"is not in","\\mathbb":"bold","\\backslash":"backslash","\\emptyset":"empty set","\\circledot":"circle","\\longleftarrow":"long left arrow","\\longleftrightarrow":"long left right arrow","\\overleftrightarrow":"over left right arrow","\\overrightarrow":"over right arrow","\\overleftarrow":"over left arrow","\\leftarrow":"left arrow","\\addmatrixcol":"add matrix columns","\\addmatrixrow":"add matrix rows"},"types":{"functionName":["f","g","h","F","G","H","\\ln","\\lg","\\log","\\sin","\\cos","\\tan","\\csc","\\sec","\\cot","\\sinh","\\cosh","\\tanh","\\csch","\\sech","\\coth"],"numberPosNeg":["\\type{number}","-\\type{number}"],"numberOrLetter":["\\type{numberPosNeg}","\\type{variable}"],"matrix":["\\begin{bmatrix}?&?&?\\end{bmatrix}"],"functionComposition":["(\\type{functionName}+\\type{functionName})","(\\type{functionName}-\\type{functionName})","(\\type{functionName}\\cdot\\type{functionName})","(\\frac{\\type{functionName}}{\\type{functionName}})"],"function":["\\type{function}^{?}","\\type{function}_{?}","\\type{functionComposition}","\\type{functionName}"],"functionCall":["\\type{function}(?)","\\type{function}[?]","\\type{variable}(\\type{number})","\\type{variable}(\\type{variable})","\\type{variable}(?,?)","\\type{variable}[\\type{number}]","\\type{variable}[\\type{variable}]","\\type{variable}[?,?]"],"commonFraction":["\\frac{\\type{integer}}{2}","\\frac{\\type{integer}}{3}","\\frac{\\type{integer}}{4}","\\frac{\\type{integer}}{5}","\\frac{\\type{integer}}{6}","\\frac{\\type{integer}}{7}","\\frac{\\type{integer}}{8}","\\frac{\\type{integer}}{9}","\\frac{\\type{integer}}{10}"],"simpleExpression":["\\type{numberOrLetter}","\\type{commonFraction}","\\type{function}(?)","\\type{function}[?]","\\type{number}","-\\type{variable}","\\type{variable}","\\type{number}\\degrees","\\type{variable}\\degrees","\\type{variable}","\\type{variable}\\type{variable}","\\type{number}\\type{variable}"],"simpleFractionPart":["-\\type{commonFraction}","\\type{simpleExpression}","\\type{commonFraction}"],"simpleFractionExtended":["\\frac{\\type{simpleFractionPart}}{\\type{simpleFractionPart}}"],"simpleNumericExponent":["\\type{number}","\\type{commonFraction}"],"simpleExponent":["\\type{simpleNumericExponent}","\\type{variable}"]},"rules":{"\\type{decimal}\\overline{\\type{integer}}":[{"the repeating decimal %1 with repeating digit %2":{"?":"%1"}}],"\\type{decimal}(\\type{integer})":[{"the repeating decimal %1 with repeating digit %2":{"?":"%1"}}],"\\overline{?}":["line segment %1"],"\\type{numberOrLetter}\\degree \\type{numberOrLetter}' \\type{numberOrLetter}''":[{"%1 %2 %3":{"1\\degree":"%1 degree","?\\degree":"%1 degrees","-?\\degree":"negative %1 degrees","1'":"%1 minute","?'":"%1 minutes","1''":"%1 second","?''":"%1 seconds"}}],"\\type{numberOrLetter}\\degree \\type{numberOrLetter}'":[{"%1 %2":{"1\\degree":"%1 degree","?\\degree":"%1 degrees","1'":"%1 minute","?'":"%1 minutes"}}],"\\type{numberOrLetter}\\degree \\type{numberOrLetter}''":[{"%1 %2":{"1\\degree":"%1 degree","?\\degree":"%1 degrees","1''":"%1 second","?''":"%1 seconds"}}],"\\type{numberOrLetter}\\degree":[{"%1":{"1":"1 degree","?":"%1 degrees"}}],"?\\degree":["%1 degrees"],"\\type{numberPosNeg}' \\type{numberPosNeg}''":[{"%1 %2":{"1'":"1 foot","?'":"%1 feet","1''":"1 inch","?''":"%1 inches"}}],"\\type{numberPosNeg}''":["%1 inches"],"\\type{numberPosNeg}'":["%1 feet"],"?^\\prime":["%1 prime"],"?'''":["%1 triple prime"],"?''":["%1 double prime"],"?'":["%1 prime"],"\\log\\type{simpleExpression}":["log %2"],"\\log ?":["the log of %2"],"\\log_{?} \\type{simpleExpression}":[{"the log base %1 of %2":{"\\log_{?}":"%2"}}],"\\ln\\type{simpleExpression}":["natural log %2"],"\\ln ?":["the natural log of %2"],"{?}":[{"start set %1 end set":{"?:?":"%1 such that %2","?|?":"%1 such that %2"}}],"?|_?":[{"%1 evaluated at %2":{"?^?":"%2 minus the same expression evaluated at %1"}}],"?|?":["%1 divides %2"],"\\type{simpleSmallRowMatrix}":[{"The 1 by %N row matrix %1":{"\\type{row}":"%1","\\type{column}":"%*"}}],"\\type{smallRowMatrix}":[{"The 1 by %N row matrix %1":{"\\type{row}":"%1","\\type{column}":"column %N %*"}}],"\\type{simpleSmallColumnMatrix}":[{"The %M by 1 column matrix %1":{"\\type{row}":"%*","\\type{column}":"%1"}}],"\\type{smallColumnMatrix}":[{"The %M by 1 column matrix %1":{"\\type{row}":"row %M %*","\\type{column}":"%1"}}],"\\type{simpleSmallMatrix}":[{"The %M by %N matrix %1":{"\\type{row}":"row %M, %*","\\type{column}":"%*"}}],"\\type{matrix}":[{"The %M by %N matrix, %1":{"\\type{row}":"row %M, %*","\\type{column}":"column %N, %*"}}],"\\sum_?^??":[{"the sum from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\sum_? ?":[{"the sum over %1 of %2":{"?=?":"%1 equals %2"}}],"\\sum_?^?":[{"the sum from %1 to %2":{"?=?":"%1 equals %2"}}],"\\sum ?":["the sum of %1"],"\\sum":["the sum"],"\\prod_?^??":[{"the product from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\prod_? ?":[{"the product over %1 of %2":{"?=?":"%1 equals %2"}}],"\\prod_?^?":[{"the product from %1 to %2":{"?=?":"%1 equals %2"}}],"\\prod ?":["the product of %1"],"\\prod":["the product"],"\\int_?^??":[{"the integral from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\int_? ?":[{"the integral over %1 of %2":{"?=?":"%1 equals %2"}}],"\\int_?^?":[{"the integral from %1 to %2":{"?=?":"%1 equals %2"}}],"\\int ?":["the integral of %1"],"\\int":["the integral"],"\\cup_?^??":[{"the union from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\cup_? ?":[{"the union over %1 of %2":{"?=?":"%1 equals %2"}}],"\\cup_?^?":[{"the union from %1 to %2":{"?=?":"%1 equals %2"}}],"\\cup ?":["the union of %1"],"\\cup":["the union"],"\\bigcup_?^??":[{"the union from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\bigcup_? ?":[{"the union over %1 of %2":{"?=?":"%1 equals %2"}}],"\\bigcup_?^?":[{"the union from %1 to %2":{"?=?":"%1 equals %2"}}],"\\bigcup ?":["the union of %1"],"\\bigcup":["the union"],"\\cap_?^??":[{"the intersection from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\cap_? ?":[{"the intersection over %1 of %2":{"?=?":"%1 equals %2"}}],"\\cap_?^?":[{"the intersection from %1 to %2":{"?=?":"%1 equals %2"}}],"\\cap ?":["the intersection of %1"],"\\cap":["the intersection"],"\\bigcap_?^??":[{"the intersection from %1 to %2 of %3":{"?=?":"%1 equals %2"}}],"\\bigcap_? ?":[{"the intersection over %1 of %2":{"?=?":"%1 equals %2"}}],"\\bigcap_?^?":[{"the intersection from %1 to %2":{"?=?":"%1 equals %2","??":"%1"}}],"\\bigcap ?":["the intersection of %1"],"\\bigcap":["the intersection"],"? \\text{and} ?":["%1 %2"],"1g":["1 gram"],"?g":["%1 grams"],"1s":["1 second"],"?s":["%1 seconds"],"1m":["1 meter"],"?m":["%1 meters"],"1L":["1 liter"],"?L":["%1 liters"],"1kg":["1 kilogram"],"?kg":["%1 kilograms"],"1ks":["1 kilosecond"],"?ks":["%1 kiloseconds"],"1km":["1 kilometer"],"?km":["%1 kilometers"],"1kL":["1 kiloliter"],"?kL":["%1 kiloliters"],"1cg":["1 centigram"],"?cg":["%1 centigrams"],"1cs":["1 centisecond"],"?cs":["%1 centiseconds"],"1cm":["1 centimeter"],"?cm":["%1 centimeters"],"1cL":["1 centiliter"],"?cL":["%1 centiliters"],"1mg":["1 milligram"],"?mg":["%1 milligrams"],"1ms":["1 millisecond"],"?ms":["%1 milliseconds"],"1mm":["1 millimeter"],"?mm":["%1 millimeters"],"1mL":["1 milliliter"],"?mL":["%1 milliliters"],"1\\mug":["1 microgram"],"?\\mug":["%1 micrograms"],"1\\mus":["1 microsecond"],"?\\mus":["%1 microseconds"],"1\\mum":["1 micrometer"],"?\\mum":["%1 micrometers"],"1\\muL":["1 microliter"],"?\\muL":["%1 microliters"],"1ng":["1 nanogram"],"?ng":["%1 nanograms"],"1ns":["1 nanosecond"],"?ns":["%1 nanoseconds"],"1nm":["1 nanometer"],"?nm":["%1 nanometers"],"1nL":["1 nanoliter"],"?nL":["%1 nanoliters"],"1lb":["1 pound"],"?lb":["%1 pounds"],"1in":["1 inch"],"?in":["%1 inches"],"1ft":["1 foot"],"?ft":["%1 feet"],"1mi":["1 mile"],"?mi":["%1 miles"],"1cup":["1 cup"],"?cup":["%1 cups"],"1pt":["1 pint"],"?pt":["%1 pints"],"1qt":["1 quart"],"?qt":["%1 quarts"],"1gal":["1 gallon"],"?gal":["%1 gallons"],"1oz":["1 ounce"],"?oz":["%1 ounces"],"\\mathbb{R}":["the real numbers"],"\\mathbb{C}":["the complex numbers"],"\\mathbb{Z}":["the integers"],"\\mathbb{Q}":["the rational numbers"],"\\mathbb{N}":["the natural numbers"],"\\mathbb{Z}^+":["the positive integers"],"\\mathbb{?}^?":[{"%2":{"\\type{integer}":"%1","R":"r","C":"c","Z":"z","Q":"q","N":"n","?^?":"%1 %2"}}],"\\mathbb{?}^3":["%1 three "],"\\mathbb{?}^n":["%1 n"],"\\mathbb{?}^\\infty":["%1 infinty"],"\\Delta":["triangle"],"$?":["%2 dollars"],"?, ?":["%1 comma %2"],"\\type{commonFraction}":[{"%%":{"\\frac{1}{2}":"1 half","\\frac{\\type{integer}}{2}":"%1 halves","\\frac{1}{3}":"1 third","\\frac{\\type{integer}}{3}":"%1 thirds","\\frac{1}{4}":"1 fourth","\\frac{\\type{integer}}{4}":"%1 fourths","\\frac{1}{5}":"1 fifth","\\frac{\\type{integer}}{5}":"%1 fifths","\\frac{1}{6}":"1 sixth","\\frac{\\type{integer}}{6}":"%1 sixths","\\frac{1}{7}":"1 seventh","\\frac{\\type{integer}}{7}":"%1 sevenths","\\frac{1}{8}":"1 eighth","\\frac{\\type{integer}}{8}":"%1 eighths","\\frac{1}{9}":"1 ninths","\\frac{\\type{integer}}{9}":"%1 ninths","\\frac{1}{10}":"1 tenths","\\frac{\\type{integer}}{10}":"%1 tenths"}}],"\\type{simpleFractionExtended}":["%1 over %2"],"\\frac{?}{?}":["the fraction with numerator %1 and denominator %2"],"\\type{function}(?)":["%1 of %2"],"\\type{function}[?]":["%1 of %2"],"\\sin ?":["sine %2"],"\\cos{?}":["cosine %2"],"\\tan{?}":["tangent %2"],"\\csc{?}":["cosecant %2"],"\\sec{?}":["secant %2"],"\\cot{?}":["cotangent %2"],"\\sin^{-1}{?}":["inverse sine %2"],"\\cos^{-1}{?}":["inverse cosine %2"],"\\tan^{-1}{?}":["inverse tangent %2"],"\\csc^{-1}{?}":["inverse cosecant %2"],"\\sec^{-1}{?}":["inverse secant %2"],"\\cot^{-1}{?}":["inverse cotangent %2"],"\\sinh^{-1}{?}":["inverse hyperbolic sine %2"],"\\cosh^{-1}{?}":["inverse hyperbolic cosine %2"],"\\tanh^{-1}{?}":["inverse hyperbolic tangent %2"],"\\csch^{-1}{?}":["inverse hyperbolic cosecant %2"],"\\sech^{-1}{?}":["inverse hyperbolic secant %2"],"\\coth^{-1}{?}":["inverse hyperbolic cotangent %2"],"?^{-1}":["%1 inverse"],"?^{0}":["%1 to the 0 power"],"?^{2}":["%1 squared"],"?^{3}":["%1 cubed"],"\\type{function}^{\\type{integer}}":["%2th power of %1"],"?^\\type{integer}":["%1 to the %2th power"],"?^\\type{variable}":["%1 to the %2th power"],"?^{-\\type{integer}}":["%1 to the %2 power"],"?^{\\type{decimal}}":["%1 raised to the %2 power"],"?^{\\type{simpleExponent}}^{2}":["%1 raised to the %2 power"],"?^{\\type{simpleExponent}}^{3}":["%1 raised to the %2 power"],"?^{\\type{simpleNumericExponent}\\type{variable}}^{2}":["%1 raised to the %2 power"],"?^{\\type{simpleNumericExponent}\\type{variable}}^{3}":["%1 raised to the %2 power"],"?^?^?":["%1 raised to the exponent %2 end exponent"],"?^?":["%1 raised to the %2 power"],"\\sqrt{\\type{simpleExpression}}":[{"options":{"EndRoot":true},"value":"square root of %1 end root"},"square root of %1"],"\\sqrt[3]{\\type{simpleExpression}}":["cube root of %1"],"\\sqrt[\\type{integer}]{\\type{simpleExpression}}":["%2th root of %1"],"\\sqrt{?}":["square root of %1 end root"],"\\sqrt[3]{?}":[{"options":{"EndRoot":true},"value":"cube root of %1 end root"},"cube root of %1"],"\\sqrt[\\type{integer}]{?}":[{"options":{"EndRoot":true},"value":"%2th root of %1 end root"},"%2th root of %1"],"\\sqrt[?]{?}":[{"options":{"EndRoot":true},"value":"%2th root of %1 end root"},"%2th root of %1"],"? \\cong ?":["%1 is congruent to %2"],"? \\parallel ?":["%1 is parallel to %2"],"? \\nparallel ?":["%1 is not parallel to %2"],"? \\sim ?":["%1 approximates %2"],"\\partial":["partial derivative"],"\\lim_{?\\to?}":["limit x to y"],"\\type{mixedFraction}":["%1 and %2"],"\\type{integer}+\\frac{\\type{integer}}{\\type{integer}}":["%1 and %2"],"\\type{scientific}":["%1 times %2"],"\\type{fraction}":["%1 over %2"],"\\type{integer}":["%1"],"\\type{decimal}":["%1"],"\\type{number}":["%1"],"?(?)":["%1 times %2"],"(?)?":["%1 times %2"],"(?)(?)":["%1 times %2"],"? \\cup ?":["union of %1 and %2"],"? \\cap ?":["intersection of %1 and %2"],"? \\not\\in ?":["%1 is not in %2"],"? \\not\\ni ?":["%1 does not contain %2"],"? \\not\\subseteq ?":["%1 is not a subset of %2"],"? \\not\\subset ?":["%1 is not a strict subset of %2"],"? \\not\\supseteq ?":["%1 is not a superset of %2"],"? \\not\\supset ?":["%1 is not a strict superset of %2"],"? \\in ?":["%1 is in %2"],"? \\ni ?":["%1 contains %2"],"? \\subseteq ?":["%1 is a subset of %2"],"? \\subset ?":["%1 is a strict subset of %2"],"? \\supseteq ?":["%1 is a superset of %2"],"? \\supset ?":["%1 is a strict superset of %2"],"{}":["left brace right brace"],"[]":["left bracket right bracket"],"[?,?]":["left bracket %1 right bracket"],"(?,?]":["left parenthesis %1 right bracket"],"[?,?)":["left bracket %1 right parenthesis"],"? \\rightarrow ?":["%1 right arrow %2"],"? \\leftarrow ?":["%1 left arrow %2"],"? \\longrightarrow ?":["%1 long right arrow %2"],"? \\longleftarrow ?":["%1 long left arrow %2"],"? \\overrightarrow ?":["%1 over right arrow %2"],"? \\overleftarrow ?":["%1 over left arrow %2"],"? \\longleftrightarrow ?":["%1 long left right arrow %2"],"? \\overleftrightarrow ?":["%1 over left right arrow %2"],"\\rightarrow ?":["right arrow %1"],"\\leftarrow ?":["left arrow %1"],"\\longrightarrow ?":["long right arrow %1"],"\\longleftarrow ?":["long left arrow %1"],"\\overrightarrow ?":["over right arrow %1"],"\\overleftarrow ?":["over left arrow %1"],"\\longleftrightarrow ?":["long left right arrow %1"],"\\overleftrightarrow ?":["over left right arrow %1"],"? \\implies ?":["%1 implies %2"],"?\\'":["%1 prime"],"? \\text{dx}":["with respect to x of %1"],"?_?":["%1 sub %2"],"?:?":["ratio of %1 to %2"],"? \\perp ?":["%1 perpendicular to %2"],"? \\propto ?":["%1 proportional to %2"],"?+?":["%1 plus %2"],"?-?":["%1 minus %2"],"?*?":["%1 times %2"],"?\\cdot?":["%1 times %2"],"?\\cdotp?":["%1 times %2"],"?<?":["%1 is less than %2"],"?<=?":["%1 is less than or equal to %2"],"?>?":["%1 is greater than %2"],"?>=?":["%1 is greater than or equal to %2"],"?=?":["%1 is equal to %2"],"?\\approx?":["%1 almost equal to %2"],"-?":["negative %1"],"?!":["%1 factorial"],"?%":["%1 percent "],"? \\pm ?":["%1 plus or minus %2"],"? \\ne ?":["%1 is not equal to %2"],"? \\neq ?":["%1 is not equal to %2"],"? \\ngtr ?":["%1 is not greater than %2"],"? \\nless ?":["%1 is not less than %2"],"? \\div ?":["%1 divided by %2"],"? \\backslash ?":["%1 left divided by %2"],"?^? ?":["%1 %2"],"? ?^?":["%1 %2"],"(\\type{simpleExpression})":["%1"],"(?)":["open paren %1 close paren"],"[\\type{simpleExpression}]":["%1"],"[?]":["open bracket %1 close bracket"],"|\\type{simpleExpression}|":["absolute value of %1"],"|?|":["start absolute value %1 end absolute value"],"{?} ?":["%1 %2"],"? ?":["%1 %2"],"?":["%1 "]}}