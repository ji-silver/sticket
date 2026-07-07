import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';

function AddDiaryScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']}>
      <View>
        <Pressable onPress={() => navigation.goBack()}>
          <ChevronLeft />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default AddDiaryScreen;
