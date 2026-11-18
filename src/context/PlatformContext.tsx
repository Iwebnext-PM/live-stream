import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  OperationType,
  auth,
  clampString,
  db,
  googleProvider,
  handleFirestoreError,
  sanitizeDocId,
  sanitizeHandle,
  sanitizeSlug,
  sanitizeTags,
} from '../services/firebase';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CREATORS,
  DEFAULT_FAQS,
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_PRICING_PLANS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_STREAMS,
  DEFAULT_TESTIMONIALS,
} from '../data/seedData';
import {
  Category,
  ContactSubmission,
  Creator,
  FaqItem,
  MediaAsset,
  PricingPlan,
  SiteSettings,
  StreamItem,
  SubmissionStatus,
  Testimonial,
  UserProfile,
  UserRole,
} from '../types/streaming';

interface PlatformContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  isAdmin: boolean;
  dataLoading: boolean;
  hasFirestoreSeed: boolean;

  siteSettings: SiteSettings;
  categories: Category[];
  creators: Creator[];
  streams: StreamItem[];
  pricingPlans: PricingPlan[];
  testimonials: Testimonial[];
  faqs: FaqItem[];
  mediaAssets: MediaAsset[];
  contactSubmissions: ContactSubmission[];
  allUsers: UserProfile[];

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleFollowCreator: (creatorId: string) => Promise<void>;
  toggleNotifications: () => Promise<void>;
  selectPlanPreference: (planName: string) => Promise<void>;
  submitContactForm: (input: {
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => Promise<void>;

  // Stream & Admin CRUD
  seedFirestoreDefaults: () => Promise<void>;
  saveSiteSettings: (data: Omit<SiteSettings, 'id' | 'updatedAt'>) => Promise<void>;
  saveCategory: (data: Partial<Category> & { name: string }, id?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveCreator: (data: Partial<Creator> & { name: string }, id?: string) => Promise<void>;
  deleteCreator: (id: string) => Promise<void>;
  saveStream: (data: Partial<StreamItem> & { title: string }, id?: string) => Promise<string>;
  deleteStream: (id: string) => Promise<void>;
  savePricingPlan: (data: Partial<PricingPlan> & { name: string }, id?: string) => Promise<void>;
  deletePricingPlan: (id: string) => Promise<void>;
  saveTestimonial: (data: Partial<Testimonial> & { authorName: string }, id?: string) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  saveFaq: (data: Partial<FaqItem> & { question: string; answer: string }, id?: string) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  updateContactStatus: (id: string, status: SubmissionStatus) => Promise<void>;
  deleteContactSubmission: (id: string) => Promise<void>;
  saveMediaAsset: (data: { title: string; mediaType: 'image' | 'video'; url: string; category: string }) => Promise<void>;
  deleteMediaAsset: (id: string) => Promise<void>;
  updateUserRole: (uid: string, role: UserRole, email: string) => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [creators, setCreators] = useState<Creator[]>(DEFAULT_CREATORS);
  const [streams, setStreams] = useState<StreamItem[]>(DEFAULT_STREAMS);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(DEFAULT_MEDIA_ASSETS);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [hasFirestoreSeed, setHasFirestoreSeed] = useState(false);

  const isBootstrapAdmin = Boolean(
    user?.email && user.emailVerified && user.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );
  const isAdmin = isBootstrapAdmin || isAdminDoc || userProfile?.role === 'admin';

  // 1. Auth State & User Profile Sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setIsAdminDoc(false);
        setContactSubmissions([]);
        setAllUsers([]);
        setAuthLoading(false);
        return;
      }

      try {
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);
        setIsAdminDoc(adminSnap.exists());
      } catch {
        setIsAdminDoc(false);
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as UserProfile);
        } else if (firebaseUser.emailVerified) {
          const isBoot =
            firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: clampString(firebaseUser.displayName || 'Stream Creator', 80),
            email: clampString(firebaseUser.email || '', 120),
            photoUrl: clampString(firebaseUser.photoURL || '', 500),
            role: isBoot ? 'admin' : 'creator',
            selectedPlan: 'Free Plan',
            notificationsEnabled: true,
            followedCreatorIds: [],
          };
          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setUserProfile(newProfile);
        }
      } catch (err) {
        console.warn('Could not sync user profile:', err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // 2. Public Collections Real-Time Listeners
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'siteSettings', 'homepage'),
        (snap) => {
          if (snap.exists()) {
            setSiteSettings({ id: snap.id, ...(snap.data() as Omit<SiteSettings, 'id'>) });
            setHasFirestoreSeed(true);
          } else {
            setSiteSettings(DEFAULT_SITE_SETTINGS);
          }
          setDataLoading(false);
        },
        (err) => {
          console.warn('siteSettings listener notice:', err.message);
          setDataLoading(false);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'categories'), orderBy('sortOrder', 'asc')),
        (snap) => {
          if (!snap.empty) {
            setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
          } else {
            setCategories(DEFAULT_CATEGORIES);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'creators'), orderBy('followersCount', 'desc')),
        (snap) => {
          if (!snap.empty) {
            setCreators(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Creator, 'id'>) })));
          } else {
            setCreators(DEFAULT_CREATORS);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'creators')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'streams'), orderBy('viewerCount', 'desc')),
        (snap) => {
          if (!snap.empty) {
            setStreams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StreamItem, 'id'>) })));
          } else {
            setStreams(DEFAULT_STREAMS);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'streams')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'pricingPlans'), orderBy('sortOrder', 'asc')),
        (snap) => {
          if (!snap.empty) {
            setPricingPlans(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PricingPlan, 'id'>) })));
          } else {
            setPricingPlans(DEFAULT_PRICING_PLANS);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'pricingPlans')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'testimonials'), orderBy('sortOrder', 'asc')),
        (snap) => {
          if (!snap.empty) {
            setTestimonials(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Testimonial, 'id'>) })));
          } else {
            setTestimonials(DEFAULT_TESTIMONIALS);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'testimonials')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'faqs'), orderBy('sortOrder', 'asc')),
        (snap) => {
          if (!snap.empty) {
            setFaqs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FaqItem, 'id'>) })));
          } else {
            setFaqs(DEFAULT_FAQS);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'faqs')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'mediaAssets'),
        (snap) => {
          if (!snap.empty) {
            setMediaAssets(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaAsset, 'id'>) })));
          } else {
            setMediaAssets(DEFAULT_MEDIA_ASSETS);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'mediaAssets')
      )
    );

    return () => unsubs.forEach((fn) => fn());
  }, []);

  // 3. Admin-Only Protected Listeners (Contact Submissions & Users)
  useEffect(() => {
    if (!user || !isAdmin) {
      setContactSubmissions([]);
      setAllUsers([]);
      return;
    }

    const unsubContacts = onSnapshot(
      query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc')),
      (snap) => {
        setContactSubmissions(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContactSubmission, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'contactSubmissions')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubContacts();
      unsubUsers();
    };
  }, [user, isAdmin]);

  // Actions
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const seedFirestoreDefaults = async () => {
    if (!user || !isAdmin) return;
    try {
      const existingSettings = await getDoc(doc(db, 'siteSettings', 'homepage'));
      const batch = writeBatch(db);

      if (!existingSettings.exists()) {
        const { id: _id, ...settingsBody } = DEFAULT_SITE_SETTINGS;
        batch.set(doc(db, 'siteSettings', 'homepage'), {
          ...settingsBody,
          updatedAt: serverTimestamp(),
        });
      }

      const existingCats = await getDocs(collection(db, 'categories'));
      if (existingCats.empty) {
        DEFAULT_CATEGORIES.forEach((cat) => {
          const { id, ...body } = cat;
          batch.set(doc(db, 'categories', id), {
            ...body,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      const existingCreators = await getDocs(collection(db, 'creators'));
      if (existingCreators.empty) {
        DEFAULT_CREATORS.forEach((creator) => {
          const { id, ...body } = creator;
          batch.set(doc(db, 'creators', id), {
            ...body,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      const existingStreams = await getDocs(collection(db, 'streams'));
      if (existingStreams.empty) {
        DEFAULT_STREAMS.forEach((stream) => {
          const { id, ...body } = stream;
          batch.set(doc(db, 'streams', id), {
            ...body,
            ownerUid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      const existingPlans = await getDocs(collection(db, 'pricingPlans'));
      if (existingPlans.empty) {
        DEFAULT_PRICING_PLANS.forEach((plan) => {
          const { id, ...body } = plan;
          batch.set(doc(db, 'pricingPlans', id), {
            ...body,
            updatedAt: serverTimestamp(),
          });
        });
      }

      const existingTestimonials = await getDocs(collection(db, 'testimonials'));
      if (existingTestimonials.empty) {
        DEFAULT_TESTIMONIALS.forEach((item) => {
          const { id, ...body } = item;
          batch.set(doc(db, 'testimonials', id), {
            ...body,
            updatedAt: serverTimestamp(),
          });
        });
      }

      const existingFaqs = await getDocs(collection(db, 'faqs'));
      if (existingFaqs.empty) {
        DEFAULT_FAQS.forEach((faq) => {
          const { id, ...body } = faq;
          batch.set(doc(db, 'faqs', id), {
            ...body,
            updatedAt: serverTimestamp(),
          });
        });
      }

      const existingMedia = await getDocs(collection(db, 'mediaAssets'));
      if (existingMedia.empty) {
        DEFAULT_MEDIA_ASSETS.forEach((asset) => {
          const { id, ...body } = asset;
          batch.set(doc(db, 'mediaAssets', id), {
            ...body,
            uploadedByUid: user.uid,
            createdAt: serverTimestamp(),
          });
        });
      }

      await batch.commit();
      setHasFirestoreSeed(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seedDatabase');
    }
  };

  const toggleFollowCreator = async (creatorId: string) => {
    if (!user || !userProfile) {
      await signInWithGoogle();
      return;
    }

    const currentlyFollowed = userProfile.followedCreatorIds || [];
    const isFollowing = currentlyFollowed.includes(creatorId);
    const nextList = isFollowing
      ? currentlyFollowed.filter((id) => id !== creatorId)
      : [...currentlyFollowed, creatorId].slice(0, 100);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        followedCreatorIds: nextList,
        updatedAt: serverTimestamp(),
      });
      setUserProfile({ ...userProfile, followedCreatorIds: nextList });

      // Update creator document in Firestore if seeded
      const creatorSnap = await getDoc(doc(db, 'creators', creatorId));
      if (creatorSnap.exists()) {
        const currentCount = (creatorSnap.data().followersCount as number) ?? 0;
        const nextCount = Math.max(0, currentCount + (isFollowing ? -1 : 1));
        await updateDoc(doc(db, 'creators', creatorId), {
          followersCount: nextCount,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Optimistic update on local default data
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creatorId
              ? { ...c, followersCount: Math.max(0, c.followersCount + (isFollowing ? -1 : 1)) }
              : c
          )
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const toggleNotifications = async () => {
    if (!user || !userProfile) {
      await signInWithGoogle();
      return;
    }
    const nextVal = !userProfile.notificationsEnabled;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: nextVal,
        updatedAt: serverTimestamp(),
      });
      setUserProfile({ ...userProfile, notificationsEnabled: nextVal });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const selectPlanPreference = async (planName: string) => {
    if (!user || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        selectedPlan: clampString(planName, 60),
        updatedAt: serverTimestamp(),
      });
      setUserProfile({ ...userProfile, selectedPlan: clampString(planName, 60) });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const submitContactForm = async (input: {
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => {
    const id = sanitizeDocId(`sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const path = `contactSubmissions/${id}`;
    try {
      const payload: Record<string, unknown> = {
        fullName: clampString(input.fullName, 100),
        email: clampString(input.email, 120),
        subject: clampString(input.subject, 140),
        message: clampString(input.message, 2000),
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.phone && input.phone.trim()) {
        payload.phone = clampString(input.phone, 30);
      }
      await setDoc(doc(db, 'contactSubmissions', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const saveSiteSettings = async (data: Omit<SiteSettings, 'id' | 'updatedAt'>) => {
    try {
      await setDoc(doc(db, 'siteSettings', 'homepage'), {
        heroHeadline: clampString(data.heroHeadline, 140),
        heroSubheadline: clampString(data.heroSubheadline, 500),
        primaryCtaLabel: clampString(data.primaryCtaLabel, 40),
        secondaryCtaLabel: clampString(data.secondaryCtaLabel, 40),
        heroMediaUrl: clampString(data.heroMediaUrl, 500),
        activeViewersCount: Math.max(0, Number(data.activeViewersCount) || 0),
        liveChannelsCount: Math.max(0, Number(data.liveChannelsCount) || 0),
        totalBroadcastsCount: Math.max(0, Number(data.totalBroadcastsCount) || 0),
        streamingBannerNotice: clampString(data.streamingBannerNotice || '', 300),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'siteSettings/homepage');
    }
  };

  const saveCategory = async (data: Partial<Category> & { name: string }, id?: string) => {
    const docId = id ? sanitizeDocId(id) : sanitizeDocId(`cat-${sanitizeSlug(data.name)}-${Date.now().toString().slice(-4)}`);
    try {
      const existing = id ? await getDoc(doc(db, 'categories', docId)) : null;
      const payload = {
        name: clampString(data.name, 50),
        slug: sanitizeSlug(data.slug || data.name),
        description: clampString(data.description || '', 200),
        sortOrder: Math.max(0, Math.min(1000, Number(data.sortOrder) || 1)),
        updatedAt: serverTimestamp(),
      };
      if (existing?.exists()) {
        await updateDoc(doc(db, 'categories', docId), payload);
      } else {
        await setDoc(doc(db, 'categories', docId), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${docId}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const saveCreator = async (data: Partial<Creator> & { name: string }, id?: string) => {
    const docId = id ? sanitizeDocId(id) : sanitizeDocId(`creator-${Date.now()}`);
    try {
      const existing = id ? await getDoc(doc(db, 'creators', docId)) : null;
      const payload = {
        name: clampString(data.name, 80),
        handle: sanitizeHandle(data.handle || data.name),
        bio: clampString(data.bio || '', 600),
        avatarUrl: clampString(data.avatarUrl || '', 500),
        primaryCategory: clampString(data.primaryCategory || 'Gaming', 50),
        followersCount: Math.max(0, Number(data.followersCount) || 0),
        isFeatured: Boolean(data.isFeatured ?? true),
        isVerified: Boolean(data.isVerified ?? false),
        updatedAt: serverTimestamp(),
      };
      if (existing?.exists()) {
        await updateDoc(doc(db, 'creators', docId), payload);
      } else {
        await setDoc(doc(db, 'creators', docId), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `creators/${docId}`);
    }
  };

  const deleteCreator = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'creators', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `creators/${id}`);
    }
  };

  const saveStream = async (data: Partial<StreamItem> & { title: string }, id?: string): Promise<string> => {
    if (!user) throw new Error('Authentication required to manage streams.');
    const docId = id ? sanitizeDocId(id) : sanitizeDocId(`stream-${Date.now()}`);
    try {
      const existing = id ? await getDoc(doc(db, 'streams', docId)) : null;
      const baseFields = {
        title: clampString(data.title, 140),
        description: clampString(data.description || '', 600),
        category: clampString(data.category || 'Technology', 50),
        tags: sanitizeTags(data.tags || ['Live'], 6, 30),
        thumbnailUrl: clampString(data.thumbnailUrl || DEFAULT_SITE_SETTINGS.heroMediaUrl, 500),
        videoPreviewUrl: clampString(data.videoPreviewUrl || '', 500),
        viewerCount: Math.max(0, Number(data.viewerCount) || 0),
        isLive: Boolean(data.isLive ?? true),
        isDemo: Boolean(data.isDemo ?? true),
        quality: data.quality || '1080p60',
        providerType: data.providerType || 'demo',
        updatedAt: serverTimestamp(),
      };

      if (existing?.exists()) {
        const updatePayload = isAdmin
          ? {
              ...baseFields,
              creatorId: sanitizeDocId(data.creatorId || (existing.data().creatorId as string) || 'creator-1'),
              creatorName: clampString(data.creatorName || (existing.data().creatorName as string) || 'Creator', 80),
              creatorAvatarUrl: clampString(data.creatorAvatarUrl || (existing.data().creatorAvatarUrl as string) || '', 500),
            }
          : baseFields;
        await updateDoc(doc(db, 'streams', docId), updatePayload);
      } else {
        await setDoc(doc(db, 'streams', docId), {
          ...baseFields,
          creatorId: sanitizeDocId(data.creatorId || user.uid),
          creatorName: clampString(data.creatorName || user.displayName || 'Creator', 80),
          creatorAvatarUrl: clampString(data.creatorAvatarUrl || user.photoURL || '', 500),
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      return docId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `streams/${docId}`);
    }
  };

  const deleteStream = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'streams', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `streams/${id}`);
    }
  };

  const savePricingPlan = async (data: Partial<PricingPlan> & { name: string }, id?: string) => {
    const docId = id ? sanitizeDocId(id) : sanitizeDocId(`plan-${Date.now()}`);
    try {
      await setDoc(doc(db, 'pricingPlans', docId), {
        name: clampString(data.name, 60),
        tagline: clampString(data.tagline || '', 120),
        priceLabel: clampString(data.priceLabel || '$0', 40),
        billingCycle: clampString(data.billingCycle || 'per month', 40),
        features: (data.features || []).map((f) => clampString(f, 140)).filter(Boolean).slice(0, 12),
        isPopular: Boolean(data.isPopular ?? false),
        ctaLabel: clampString(data.ctaLabel || 'Select Plan', 40),
        sortOrder: Math.max(0, Number(data.sortOrder) || 1),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pricingPlans/${docId}`);
    }
  };

  const deletePricingPlan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pricingPlans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pricingPlans/${id}`);
    }
  };

  const saveTestimonial = async (data: Partial<Testimonial> & { authorName: string }, id?: string) => {
    const docId = id ? sanitizeDocId(id) : sanitizeDocId(`test-${Date.now()}`);
    try {
      await setDoc(doc(db, 'testimonials', docId), {
        authorName: clampString(data.authorName, 80),
        authorRole: clampString(data.authorRole || 'Creator', 100),
        organization: clampString(data.organization || 'Independent Studio', 100),
        avatarUrl: clampString(data.avatarUrl || '', 500),
        quote: clampString(data.quote || 'Great live streaming workflow.', 500),
        isSample: Boolean(data.isSample ?? true),
        sortOrder: Math.max(0, Number(data.sortOrder) || 1),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `testimonials/${docId}`);
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
    }
  };

  const saveFaq = async (data: Partial<FaqItem> & { question: string; answer: string }, id?: string) => {
    const docId = id ? sanitizeDocId(id) : sanitizeDocId(`faq-${Date.now()}`);
    try {
      await setDoc(doc(db, 'faqs', docId), {
        question: clampString(data.question, 200),
        answer: clampString(data.answer, 1000),
        sortOrder: Math.max(0, Number(data.sortOrder) || 1),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `faqs/${docId}`);
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'faqs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `faqs/${id}`);
    }
  };

  const updateContactStatus = async (id: string, status: SubmissionStatus) => {
    try {
      await updateDoc(doc(db, 'contactSubmissions', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contactSubmissions/${id}`);
    }
  };

  const deleteContactSubmission = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contactSubmissions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contactSubmissions/${id}`);
    }
  };

  const saveMediaAsset = async (data: {
    title: string;
    mediaType: 'image' | 'video';
    url: string;
    category: string;
  }) => {
    if (!user) return;
    const docId = sanitizeDocId(`asset-${Date.now()}`);
    try {
      await setDoc(doc(db, 'mediaAssets', docId), {
        title: clampString(data.title, 100),
        mediaType: data.mediaType,
        url: clampString(data.url, 350000),
        category: clampString(data.category || 'General', 50),
        uploadedByUid: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `mediaAssets/${docId}`);
    }
  };

  const deleteMediaAsset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mediaAssets', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mediaAssets/${id}`);
    }
  };

  const updateUserRole = async (uid: string, role: UserRole, email: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
      if (role === 'admin') {
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email: clampString(email, 120),
          grantedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } else if (uid !== user.uid) {
        await deleteDoc(doc(db, 'admins', uid));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const value = useMemo<PlatformContextValue>(
    () => ({
      user,
      userProfile,
      authLoading,
      isAdmin,
      dataLoading,
      hasFirestoreSeed,
      siteSettings,
      categories,
      creators,
      streams,
      pricingPlans,
      testimonials,
      faqs,
      mediaAssets,
      contactSubmissions,
      allUsers,
      signInWithGoogle,
      signOut,
      toggleFollowCreator,
      toggleNotifications,
      selectPlanPreference,
      submitContactForm,
      seedFirestoreDefaults,
      saveSiteSettings,
      saveCategory,
      deleteCategory,
      saveCreator,
      deleteCreator,
      saveStream,
      deleteStream,
      savePricingPlan,
      deletePricingPlan,
      saveTestimonial,
      deleteTestimonial,
      saveFaq,
      deleteFaq,
      updateContactStatus,
      deleteContactSubmission,
      saveMediaAsset,
      deleteMediaAsset,
      updateUserRole,
    }),
    [
      user,
      userProfile,
      authLoading,
      isAdmin,
      dataLoading,
      hasFirestoreSeed,
      siteSettings,
      categories,
      creators,
      streams,
      pricingPlans,
      testimonials,
      faqs,
      mediaAssets,
      contactSubmissions,
      allUsers,
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
