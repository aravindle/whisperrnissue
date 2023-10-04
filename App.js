import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import RNFS from 'react-native-fs';
import {initWhisper} from 'whisper.rn';
import {
  PrimaryButton,
  ButtonText,
  LabelText,
} from '../../components/reusable/UIComponentsBeeApp';

const fileDir = `${RNFS.DocumentDirectoryPath}/whisper`;
const recordFile = `${fileDir}/realtime.wav`
// const modelHost =
//   'https://huggingface.co/TheAIchemist13/whisper-tiny-hi/resolve/main';  //change for language #switch

const modelHost =
  'https://huggingface.co/TheAIchemist13/whisper-ind-cpp-models/resolve/main';

const createDir = async () => {
  if (!(await RNFS.exists(fileDir))) {
    console.log('Creating dir--', fileDir);
    await RNFS.mkdir(fileDir);
  }
};

const progress = params => {
  console.log('params: ', params);
};

export default function WhisperScreenTest() {
  const [whisperContext, setWhisperContext] = useState(null);
  const [transcibeResult, setTranscibeResult] = useState(null);
  const [stopTranscribe, setStopTranscribe] = useState(null);

  const reqPermissions = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    console.log('granted: ', granted);
  };

  useEffect(() => {
    reqPermissions();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            if (whisperContext) {
              console.log('Found previous context');
              await whisperContext.release();
              setWhisperContext(null);
              console.log('Released previous context');
            }
            await createDir();
            const modelFilePath = `${fileDir}/ggml-model-kn.bin`; //change
            // const modelFilePath = `${fileDir}/ggml-model-hi.bin`; //change for language #switch
            console.log('fileDir: ', fileDir);
            if (await RNFS.exists(modelFilePath)) {
              console.log('Model already exists: at', modelFilePath);
            } else {
              console.log('---Local model not accessible');
              const {promise: downloadPromise} = RNFS.downloadFile({
                fromUrl: `${modelHost}/ggml-model-kn.bin`, //change for language #switch
                // fromUrl: `${modelHost}/ggml-model-hi.bin`, //change for language #switch
                toFile: modelFilePath,
                readTimeout: 60000,
                progress: res => {
                  let progressPercent =
                    (res.bytesWritten / res.contentLength) * 100; // to calculate in percentage
                  console.log('\n\nprogress===', progressPercent);
                },
              });
              downloadPromise
                .then(result => {
                  console.log('result', result);
                  console.log('result:-statuscode', result.statusCode);
                  console.log('---success download if statuscode 200');
                })
                .catch(err => {
                  console.log('err: ', err);
                });
            }
          }}>
          <Text style={styles.buttonText}>Initialize Model</Text>
        </TouchableOpacity>
      </View>
      {/* --Initialize context */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            stopTranscribe?.stop ? styles.buttonClear : null,
          ]}
          onPress={async () => {
            if (whisperContext) {
              console.log('Found previous context');
              await whisperContext.release();
              setWhisperContext(null);
              console.log('Released previous context');
            }
            const modelFilePath = `${fileDir}/ggml-model-kn.bin`; //change for language
            // const modelFilePath = `${fileDir}/ggml-model-hi.bin`; //change for language #switch
            if (await RNFS.exists(modelFilePath)) {
              console.log('Model already exists: at', modelFilePath);
              console.log('Initialize context...');
              const options = {language: 'kn'}; //change for language #switch
              //  const options = {language: 'hi'}; //change for language #switch
              const ctx = await initWhisper({filePath: modelFilePath}, options);
              console.log('ctx: ', ctx);
              console.log('Loaded model, ID:', ctx.id);
              setWhisperContext(ctx);
            } else {
              console.log('model doesnt exist at location');
            }
          }}>
          <Text style={styles.buttonText}>{'Initialize context'}</Text>
        </TouchableOpacity>
      </View>
      {/* --Transcribe Result */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            stopTranscribe?.stop ? styles.buttonClear : null,
          ]}
          onPress={async () => {
            if (!whisperContext) {
              console.log('No Context');
            }
            if (stopTranscribe?.stop) {
              const t0 = Date.now();
              await stopTranscribe?.stop();
              const t1 = Date.now();
              console.log('Stopped transcribing in', t1 - t0, 'ms');
              setStopTranscribe(null);
              return;
            }
            console.log(
              'Start realtime transcribing with context',
              whisperContext,
            );
            try {
              // await createDir();
              const {stop, subscribe} = await whisperContext
                .transcribeRealtime
                // {
                //   language: 'kn', //change for language
                // },
                ();
              setStopTranscribe({stop});
              subscribe(evt => {
                const {isCapturing, data, processTime, recordingTime} = evt;
                setTranscibeResult(
                  `Realtime transcribing: ${isCapturing ? 'ON' : 'OFF'}\n` +
                    `Result: ${data?.result}\n\n` +
                    `Process time: ${processTime}ms\n` +
                    `Recording time: ${recordingTime}ms`,
                );
                if (!isCapturing) {
                  setStopTranscribe(null);
                }
              });
            } catch (e) {
              console.log('Error:', e);
            }
          }}>
          <Text style={styles.buttonText}>
            {stopTranscribe?.stop
              ? 'Stop Realtime Transcribing'
              : 'Start Realtime Transcribing'}
          </Text>
        </TouchableOpacity>
      </View>
      {transcibeResult && (
        <View style={styles.logContainer}>
          <Text style={styles.logText}>{transcibeResult}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollview: {flexGrow: 1, justifyContent: 'center'},
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 40,
  },
  buttons: {flexDirection: 'row'},
  button: {margin: 4, backgroundColor: '#333', borderRadius: 4, padding: 8},
  buttonClear: {backgroundColor: '#888'},
  buttonText: {fontSize: 16, color: 'white', textAlign: 'center'},
  logContainer: {
    backgroundColor: 'lightgray',
    padding: 8,
    width: '95%',
    borderRadius: 8,
    marginVertical: 8,
  },
  logText: {fontSize: 18, color: '#333'},
});
