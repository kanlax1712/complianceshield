package com.complianceshield.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    primary = AccentCyan,
    onPrimary = BlueEnd,
    background = BlueEnd,
    onBackground = TextOnDark,
    surface = BlueEnd,
    onSurface = TextOnDark
)

private val LightColors = lightColorScheme(
    primary = AccentCyan,
    onPrimary = BlueEnd,
    background = BlueEnd,
    onBackground = TextOnDark,
    surface = BlueEnd,
    onSurface = TextOnDark
)

@Composable
fun ComplianceShieldTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        content = content
    )
}
