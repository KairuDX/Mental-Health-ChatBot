import { StyleSheet, View } from 'react-native';
import Healio from './src/Healio';

export default function App() {
  return (
    <View style={styles.container}>
        <Healio />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
});
