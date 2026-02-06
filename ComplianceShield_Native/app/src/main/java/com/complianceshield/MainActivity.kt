package com.complianceshield

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.complianceshield.ui.theme.ComplianceShieldTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ComplianceShieldTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    AppNavigator()
                }
            }
        }
    }
}

private sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Otp : Screen("otp")
    data object Dashboard : Screen("dashboard")
}

@Composable
private fun AppNavigator() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            LoginScreen(
                onSubmit = { navController.navigate(Screen.Otp.route) }
            )
        }
        composable(Screen.Otp.route) {
            OtpScreen(
                onVerify = { navController.navigate(Screen.Dashboard.route) },
                onBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Dashboard.route) {
            DashboardScreen(navController)
        }
    }
}

@Composable
private fun GradientBackground(content: @Composable ColumnScope.() -> Unit) {
    val gradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF0B5688),
            Color(0xFF0B6BA1),
            Color(0xFF0A3F66)
        )
    )
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(gradient)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        content = content
    )
}

@Composable
private fun LoginScreen(onSubmit: () -> Unit) {
    var phone by remember { mutableStateOf("") }
    GradientBackground {
        Text("ComplianceShield", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
        Text("Mobile Audit Infrastructure", fontSize = 14.sp, color = Color(0xFFBFD7E5))
        Spacer(modifier = Modifier.height(24.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.12f), RoundedCornerShape(32.dp))
                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(32.dp))
                .padding(24.dp)
        ) {
            Text("Phone Number", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFBFD7E5))
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it.filter { ch -> ch.isDigit() }.take(10) },
                placeholder = { Text("Enter mobile number", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onSubmit,
                enabled = phone.length >= 10,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF66E0FF), contentColor = Color(0xFF0B2A3A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Request OTP", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun OtpScreen(onVerify: () -> Unit, onBack: () -> Unit) {
    GradientBackground {
        Text("Verify Account", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(6) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                )
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onVerify,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF66E0FF), contentColor = Color(0xFF0B2A3A))
        ) {
            Text("Verify & Enter", fontWeight = FontWeight.Bold)
        }
        TextButton(onClick = onBack) {
            Text("Use a different number", color = Color.White.copy(alpha = 0.7f))
        }
    }
}

private data class AuditItem(val name: String, val brand: String, val score: Int)

@Composable
private fun DashboardScreen(navController: NavHostController) {
    val items = remember {
        listOf(
            AuditItem("Choco Bar", "SweetCo", 92),
            AuditItem("Granola Mix", "NutriPack", 76)
        )
    }
    val gradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF0B5688),
            Color(0xFF0B6BA1),
            Color(0xFF0A3F66)
        )
    )
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(gradient)
            .padding(20.dp)
    ) {
        Text("Inventory Audit", fontSize = 26.sp, fontWeight = FontWeight.Black, color = Color.White)
        Text("Production mobile compliance infrastructure.", fontSize = 12.sp, color = Color(0xFFBFD7E5))
        Spacer(modifier = Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(
                onClick = { },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF66E0FF), contentColor = Color(0xFF0B2A3A)),
                modifier = Modifier.weight(1f)
            ) {
                Text("Image Upload", fontWeight = FontWeight.Bold)
            }
            OutlinedButton(
                onClick = { },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
            ) {
                Text("Barcode Scanner", fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(items) { item ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White.copy(alpha = 0.12f), RoundedCornerShape(24.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(24.dp))
                        .padding(16.dp)
                ) {
                    Text(item.name, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("${item.brand} • ${item.score}%", fontSize = 12.sp, color = Color(0xFFBFD7E5))
                }
            }
        }
    }
}
