import { Redirect } from 'expo-router';
import { useRemote } from '../remote/RemoteContext';
export default function Index(){ const {ready,session}=useRemote(); if(!ready)return null; return <Redirect href={session?'/live/home':'/connect'}/>; }
