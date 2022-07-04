import { initializeApp } from 'firebase/app';
import {
  deleteObject,
  getBlob,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

const getFileName = (str) => str.split('/').slice(1).join('/');

class Firebase {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.storage = getStorage(this.app);
    this.db = getFirestore();
  }

  async downloadFiles({ files }) {
    const blobs = await Promise.all(
      files.map((file) => getBlob(ref(this.storage, file)))
    );

    let file;
    let fileName;

    if (blobs.length > 1) {
      const zip = new JSZip();
      blobs.forEach((blob, index) => {
        const fileName = getFileName(files[index]);
        zip.file(fileName, blob);
      });
      file = await zip.generateAsync({ type: 'blob' });
      fileName = `combined-${new Date().getTime()}.zip`;
    } else {
      file = blobs[0];
      fileName = getFileName(files[0]);
    }

    return FileSaver.saveAs(file, fileName);
  }

  async deleteDeposit({ id, files }) {
    for (const file of files) {
      const fileRef = ref(this.storage, file);
      await deleteObject(fileRef);
    }

    await deleteDoc(doc(this.db, 'deposits', id));
  }

  async uploadDeposit(title, files) {
    const newDocRef = await doc(collection(this.db, 'deposits'));

    const filePaths = await this.uploadFiles(newDocRef.id, files);

    await setDoc(newDocRef, { title, files: filePaths, created: new Date() });
  }

  async uploadFiles(id, files) {
    const fullPaths = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storageRef = ref(this.storage, `${id}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);

      fullPaths.push(snapshot.metadata.fullPath);
    }

    return fullPaths;
  }

  subscribeToDeposits(cb) {
    const q = query(
      collection(this.db, 'deposits'),
      orderBy('created', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      cb && cb(docs);
    });
  }
}

export default Firebase;
