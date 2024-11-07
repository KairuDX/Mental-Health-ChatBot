import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';

const App = () => {
  const [message, setMessage] = useState<string>('');

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter a message');
      return;
    }

    // Placing Gemini API here I guess lol?.

    setMessage('');
  };

  return (
    <View style={styles.container}>
      <Text>Mental Health Chatbot(WIP)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your message"
        value={message}
        onChangeText={setMessage}
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default App;
