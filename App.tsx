import { Camera, useCameraPermissions, CameraView } from 'expo-camera';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import forge from 'node-forge';

const validateFromQRCode = async (qrData) => {
  try {
    const { id, hash, hashRsa, publicKey, documentName, imageUri, base64Image } = qrData;

    if (!id || !hash || !hashRsa || !publicKey) {
      throw new Error("Dados do QR Code estão incompletos ou inválidos.");
    }

    const publicKeyBytes = forge.util.decode64(publicKey);
    const publicKeyAsn1 = forge.asn1.fromDer(forge.util.createBuffer(publicKeyBytes));
    const publicKeyObject = forge.pki.publicKeyFromAsn1(publicKeyAsn1);
    const signatureBytes = forge.util.decode64(hashRsa);
    const md = forge.md.sha256.create();
    md.update(hash);

    const isValid = publicKeyObject.verify(md.digest().bytes(), signatureBytes);
    const message = isValid ? "Assinatura válida!" : "Assinatura inválida!";

    return message;
  } catch (error) {
    console.error("Erro ao validar dados do QR Code:", error);
    return "Erro ao validar QR Code.";
  }
};

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Desculpe, precisamos da permissão da câmera para fazer isso funcionar!');
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    try {
      const qrData = JSON.parse(data);
      const validationMessage = await validateFromQRCode(qrData);

      Alert.alert(
        `Código ${type} Scaneado`,
        `Resultado: ${validationMessage}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setIsCameraActive(false);
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert(
        `Erro ao processar QR Code`,
        `Detalhes: Dados inválidos`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setIsCameraActive(false);
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Permissão da câmera não concedida.</Text>
        <Button title="Solicitar Permissão" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCameraActive ? (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.layerContainer}>
            <View style={styles.layerTop} />
            <View style={styles.layerCenter}>
              <View style={styles.layerLeft} />
              <View style={styles.focused} />
              <View style={styles.layerRight} />
            </View>
            <View style={styles.layerBottom} />
          </View>
          <Button
            title="Fechar Leitor"
            onPress={() => setIsCameraActive(false)}
            color="#ff0000"
          />
        </CameraView>
      ) : (
        <>
          <Image
            source={require('./assets/logo.png')} // Adicione seu logotipo na pasta 'assets' e substitua o nome do arquivo
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>DOCS APP</Text>
          <Text style={styles.subtitle}>Validação de QR Code</Text>
          <Button title="Abrir Leitor de QR Code" onPress={() => setIsCameraActive(true)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'blue',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  layerContainer: {
    flex: 1,
  },
  layerTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  layerCenter: {
    flexDirection: 'row',
  },
  layerLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  focused: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  layerRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  layerBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
