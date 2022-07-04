import {initializeApp} from 'firebase/app';
import {getStorage, ref, uploadBytes, deleteObject, getBlob} from 'firebase/storage';
import {collection, doc, getFirestore, onSnapshot, orderBy, query, setDoc, deleteDoc} from 'firebase/firestore';
import JSZip from 'jszip'
import FileSaver from 'file-saver'

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
};

class Firebase {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.storage = getStorage(this.app);
        this.db = getFirestore();
    }

    async downloadFiles({files}) {
        const zip = new JSZip();
        const blobs = await Promise.all(files.map(file => getBlob(ref(this.storage, file))));

        blobs.forEach((blob, index) => {
            const fileName = files[index].split('/').slice(1).join('/');
            zip.file(fileName, blob);
        })

        const zipFile = await zip.generateAsync();
        const fileName = `combined-${new Date().getTime()}.zip`;

        return FileSaver.saveAs(zipFile, fileName)
    }

    async deleteDeposit({id, files}) {
        for (const file of files) {
            const fileRef = ref(this.storage, file);
            await deleteObject(fileRef)
        }

        await deleteDoc(doc(this.db, "deposits", id));
    }

    async uploadDeposit(title, files) {
        const newDocRef = await doc(collection(this.db, 'deposits'))

        const filePaths = await this.uploadFiles(newDocRef.id, files)

        await setDoc(newDocRef, {title, files: filePaths, created: new Date()})
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
        const q = query(collection(this.db, 'deposits'), orderBy('created', 'desc'));

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
