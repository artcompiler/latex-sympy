export var rules={"words":{"A":"cap a","B":"cap b","C":"cap c","D":"cap d","E":"cap e","F":"cap f","G":"cap g","H":"cap h","I":"cap i","J":"cap j","K":"cap k","L":"cap l","M":"cap m","N":"cap n","O":"cap o","P":"cap p","Q":"cap q","R":"cap r","S":"cap s","T":"cap t","U":"cap u","V":"cap v","W":"cap w","X":"cap x","Y":"cap y","Z":"cap z","\\Alpha":"cap alpha","\\Beta":"cap beta","\\Gamma":"cap gamma","\\Delta":"cap delta","\\Epsilon":"cap epsilon","\\Zeta":"cap zeta","\\Eta":"cap eta","\\Theta":"cap theta","\\Iota":"cap iota","\\Kappa":"cap kappa","\\Lambda":"cap lambda","\\Mu":"cap mu","\\Nu":"cap nu","\\Xi":"cap xi","\\Omicron":"cap omicron","\\Pi":"cap pi","\\Rho":"cap rho","\\Sigma":"cap sigma","\\Tau":"cap tau","\\Upsilon":"cap upsilon","\\Phi":"cap phi","\\Chi":"cap chi","\\Psi":"cap psi","\\Omega":"cap omega","kg":"kilograms","km":"kilometers","\\ldots":"dot dot dot","\\infty":"infinity","\\measuredangle":"measure of angle","\\cong":"congruent","\\sin":"sine","\\cos":"cosine","\\tan":"tangent","\\csc":"cosecant","\\sec":"secant","\\cot":"cotangent","\\sinh":"hyperbolic sine","\\cosh":"hyperbolic cosine","\\tanh":"hyperbolic tangent","\\csch":"hyperbolic cosecant","\\sech":"hyperbolic secant","\\coth":"hyperbolic cotangent","\\ln":"natural log","\\log":"log","\\lg":"log","'":"prime","\\notin":"not in"},"types":{"functionName":["f","g","h","F","G","H","\\ln","\\lg","\\log","\\sin","\\cos","\\tan","\\csc","\\sec","\\cot","\\sinh","\\cosh","\\tanh","\\csch","\\sech","\\coth"],"functionComposition":["(\\type{functionName}+\\type{functionName})","(\\type{functionName}-\\type{functionName})","(\\type{functionName}\\cdot\\type{functionName})","(\\type{simpleFractionExtended})"],"function":["\\type{function}^{?}","\\type{function}_{?}","\\type{functionComposition}","\\type{functionName}"],"functionCall":["\\type{function}(?)","\\type{function}[?]","\\type{variable}(\\type{number})","\\type{variable}(\\type{variable})","\\type{variable}(?,?)","\\type{variable}[\\type{number}]","\\type{variable}[\\type{variable}]","\\type{variable}[?,?]"],"commonFraction":["\\frac{\\type{integer}}{2}","\\frac{\\type{integer}}{3}","\\frac{\\type{integer}}{4}","\\frac{\\type{integer}}{5}","\\frac{\\type{integer}}{6}","\\frac{\\type{integer}}{7}","\\frac{\\type{integer}}{8}","\\frac{\\type{integer}}{9}","\\frac{\\type{integer}}{10}"],"simpleExpression":["\\type{commonFraction}","\\type{function}(?)","\\type{function}[?]","\\type{number}","-\\type{variable}","\\type{variable}","\\type{number}\\degrees","\\type{variable}\\degrees","\\type{variable}","\\type{variable}\\type{variable}","\\type{number}\\type{variable}"],"simpleFractionPart":["-\\type{commonFraction}","\\type{simpleExpression}","\\type{commonFraction}"],"simpleFractionExtended":["\\frac{\\type{simpleFractionPart}}{\\type{simpleFractionPart}}"],"simpleNumericExponent":["\\type{number}","\\type{commonFraction}"],"simpleExponent":["\\type{simpleNumericExponent}","\\type{variable}"]},"rules":{"\\mathbb{R}":["the real numbers"],"\\mathbb{C}":["the complex numbers"],"\\mathbb{Z}":["the integers"],"\\mathbb{Q}":["the rational numbers"],"\\mathbb{N}":["the natural numbers"],"\\mathbb{Z}^+":["the positive integers"],"\\mathbb{?}^?":[{"%2":{"\\type{integer}":"%1","R":"r","C":"c","Z":"z","Q":"q","N":"n","?^?":"%1 %2"}}],"\\mathbb{?}^3":["%1 three"],"\\mathbb{?}^n":["%1 n"],"\\mathbb{?}^\\infty":["%1 infinty"],"\\Delta":["triangle"],"?'''":["%1 triple prime"],"?''":["%1 double prime"],"?'":["%1 prime"],"?, ?":["%1 comma %2"],"\\type{commonFraction}":[{"%%":{"\\frac{1}{2}":"1 half","\\frac{\\type{integer}}{2}":"%1 halves","\\frac{1}{3}":"1 third","\\frac{\\type{integer}}{3}":"%1 thirds","\\frac{1}{4}":"1 fourth","\\frac{\\type{integer}}{4}":"%1 fourths","\\frac{1}{5}":"1 fifth","\\frac{\\type{integer}}{5}":"%1 fifths","\\frac{1}{6}":"1 sixth","\\frac{\\type{integer}}{6}":"%1 sixths","\\frac{1}{7}":"1 seventh","\\frac{\\type{integer}}{7}":"%1 sevenths","\\frac{1}{8}":"1 eighth","\\frac{\\type{integer}}{8}":"%1 eighths","\\frac{1}{9}":"1 ninths","\\frac{\\type{integer}}{9}":"%1 ninths","\\frac{1}{10}":"1 tenths","\\frac{\\type{integer}}{10}":"%1 tenths"}}],"\\type{simpleFractionExtended}":["%1 over %2"],"\\frac{?}{?}":["the fraction with numerator %1 and denominator %2"],"?^{-1}":["%1 inverse"],"?^{0}":["%1 to the 0 power"],"?^{2}":["%1 squared"],"?^{3}":["%1 cubed"],"\\type{function}^{\\type{integer}}":["%2th power of %1"],"?^\\type{integer}":["%1 to the %2th power"],"?^\\type{variable}":["%1 to the %2th power"],"?^{-\\type{integer}}":["%1 to the %2 power"],"?^{\\type{decimal}}":["%1 raised to the %2 power"],"?^{\\type{simpleExponent}}^{2}":["%1 raised to the %2 power"],"?^{\\type{simpleExponent}}^{3}":["%1 raised to the %2 power"],"?^{\\type{simpleNumericExponent}\\type{variable}}^{2}":["%1 raised to the %2 power"],"?^{\\type{simpleNumericExponent}\\type{variable}}^{3}":["%1 raised to the %2 power"],"?^?^?":["%1 raised to the exponent %2 end exponent"],"?^?":["%1 raised to the %2 power"],"\\sqrt{\\type{simpleExpression}}":["square root of %1"],"\\sqrt[3]{\\type{simpleExpression}}":["cube root of %1"],"\\sqrt[\\type{integer}]{\\type{simpleExpression}}":["%2th root of %1"],"\\sqrt{?}":[{"options":{"EndRoot":true},"value":"square root of %1 end root"},"square root of %1"],"\\sqrt[3]{?}":[{"options":{"EndRoot":true},"value":"cube root of %1 end root"},"cube root of %1"],"\\sqrt[\\type{integer}]{?}":[{"options":{"EndRoot":true},"value":"%2th root of %1 end root"},"%2th root of %1"],"\\sqrt[?]{?}":[{"options":{"EndRoot":true},"value":"%2th root of %1 end root"},"%2th root of %1"],"\\log_{?} ?":[{"log base %1 of %2":{"\\log_{?}":"%2"}}],"\\type{function}(?)":["%1 of %2"],"\\type{function}[?]":["%1 of %2"],"\\sin ?":["sine %2"],"\\cos{?}":["cosine %2"],"\\tan{?}":["tangent %2"],"\\csc{?}":["cosecant %2"],"\\sec{?}":["secant %2"],"\\cot{?}":["cotangent %2"],"\\sin^{-1}{?}":["inverse sine %2"],"\\cos^{-1}{?}":["inverse cosine %2"],"\\tan^{-1}{?}":["inverse tangent %2"],"\\csc^{-1}{?}":["inverse cosecant %2"],"\\sec^{-1}{?}":["inverse secant %2"],"\\cot^{-1}{?}":["inverse cotangent %2"],"\\sinh^{-1}{?}":["inverse hyperbolic sine %2"],"\\cosh^{-1}{?}":["inverse hyperbolic cosine %2"],"\\tanh^{-1}{?}":["inverse hyperbolic tangent %2"],"\\csch^{-1}{?}":["inverse hyperbolic cosecant %2"],"\\sech^{-1}{?}":["inverse hyperbolic secant %2"],"\\coth^{-1}{?}":["inverse hyperbolic cotangent %2"],"\\type{mixedFraction}":["%1 and %2"],"\\type{scientific}":["%1 times %2"],"\\type{fraction}":["%1 over %2"],"\\type{integer}":["%1"],"\\type{decimal}":["%1"],"\\type{number}":["%1"],"?(?)":["%1 times %2"],"(?)?":["%1 times %2"],"(?)(?)":["%1 times %2"],"? \\degree":["%1 degrees"],"? \\in ?":["%1 in %2"],"?^\\prime":["%1 prime"],"\\sum ?":["the sum of %1"],"\\prod ?":["the product of %1"],"\\int_?^? ?":["integral on the interval from %1 to %2 of %3"],"\\int ?":["integral %1"],"\\bigcup ?":["union %1"],"? \\cup ?":["union %1 %2"],"\\bigcap ?":["intersection %1"],"? \\cap ?":["intersection %1 %2"],"{}":["left brace right brace"],"[]":["left bracket right bracket"],"{?}":["start set %1 end set"],"[?,?]":["left bracket %1 right bracket"],"(?,?]":["left parenthesis %1 right bracket"],"[?,?)":["left bracket %1 right parenthesis"],"? \\rightarrow ?":["%1 right arrow %2"],"?\\'":["%1 prime"],"?\\overline{?}":["%1 modifying above %2 with bar"],"?:N+\\frac{?:N}{?:N}":["%1 and %2"],"? \\text{dx}":["with respect to x of %1"],"?_?":["%1 sub %2"],"?:?":["ratio of %1 to %2"],"?\\ne?":["%1 not equal to %2"],"?+?":["%1 plus %2"],"?-?":["%1 minus %2"],"?*?":["%1 times %2"],"?\\cdot?":["%1 times %2"],"?<?":["%1 is less than %2"],"?<=?":["%1 is less than or equal to %2"],"?>?":["%1 is greater than %2"],"?>=?":["%1 is greater than or equal to %2"],"?=?":["%1 equals %2"],"?\\approx?":["%1 almost equals %2"],"-?":["negative %1"],"?!":["%1 factorial"],"?%":["%1 percent"],"? \\pm ?":["%1 plus or minus %2"],"? \\ne ?":["%1 not equal to %2"],"? \\div ?":["%1 divided by %2"],"\\overline{?}":["line segment %1"],"?^? ?":["%1 %2"],"? ?^?":["%1 %2"],"(\\type{simpleExpression})":["%1"],"(?)":["open paren %1 close paren"],"[\\type{simpleExpression}]":["%1"],"[?]":["open bracket %1 close bracket"],"|\\type{simpleExpression}|":["absolute value of %1"],"|?|":["start absolute value %1 end absolute value"],"{?} ?":["%1 %2"],"? ?":["%1 %2"],"?":["%1 "]}}