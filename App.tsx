import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,Image,TouchableOpacity,ScrollView,TextInput,KeyboardAvoidingView,FlatList,
        ImageSourcePropType,Platform,Dimensions} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {NavigationContainer,NavigatorScreenParams,RouteProp,} from '@react-navigation/native';
import {createNativeStackNavigator,NativeStackScreenProps,} from '@react-navigation/native-stack';
import {createDrawerNavigator,DrawerNavigationProp,} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons'; // Using Expo vector icons for simplicity`
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const { width } = Dimensions.get('window');
const SPACING = 20

const LAST_EMAIL_KEY = 'lastUsedEmail';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

type RootStackParamList = {
  Empower: undefined;
  Login: undefined;
  SignUp: undefined;
  AppDrawer: NavigatorScreenParams<AppDrawerParamList>;
};

type AppDrawerParamList = {
  About: undefined;
  Courses: undefined;
  SixWeekCourses: undefined;
  SixMonthCourses: undefined;
  Cooking: undefined;
  ChildMinding: undefined;
  GardenMaintenance: undefined;
  Sewing: undefined;
  FirstAid: undefined;
  LifeSkills: undefined;
  Landscaping: undefined;
  CourseSelection: undefined;
  Confirmation: { selectedCourseIds: string[] };
};

// Helper type: only routes whose params allow `undefined` (i.e., no required params)
type RoutesWithoutParams = {
  [K in keyof AppDrawerParamList]: undefined extends AppDrawerParamList[K] ? K : never
}[keyof AppDrawerParamList];

type EmpowerScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'Empower'
>['navigation'];
type AuthScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'Login' | 'SignUp'
>['navigation'];

type DrawerScreenProps<T extends keyof AppDrawerParamList> = {
  navigation: DrawerNavigationProp<AppDrawerParamList, T>;
  route: RouteProp<AppDrawerParamList, T>;
};

interface Skill {
  label: string;
  image: ImageSourcePropType;
  color: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  fee?: string; 
  target?: keyof AppDrawerParamList; 
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<AppDrawerParamList>();

const skills: Skill[] = [
  { label: 'COOKING COURSE', image: require('./assets/snack-icon.png'), color: '#d32f2f' },
  { label: 'SEWING', image: require('./assets/snack-icon.png'), color: '#388e3c' },
  { label: 'FIRST AID', image: require('./assets/snack-icon.png'), color: '#d32f2f' },
  { label: 'LANDSCAPING', image: require('./assets/snack-icon.png'), color: '#388e3c' },
];

// Helper to add a menu button for screens inside the Drawer
const MenuButton: React.FC<{
  navigation: DrawerNavigationProp<AppDrawerParamList, keyof AppDrawerParamList>;
}> = ({ navigation }) => (
  <TouchableOpacity style={styles.menuButton} onPress={() => navigation.toggleDrawer()}>
    <Ionicons name="menu" size={30} color="white" />
  </TouchableOpacity>
);

// --- CENTRALIZED COURSE DATA AND HELPERS ---
const ALL_COURSES: (Course & { duration: string })[] = [
  // 6 MONTH COURSES
  {
    id: 'Sewing',
    title: 'Sewing',
    description: 'Master tailoring and garment construction.',
    image: require('./assets/snack-icon.png'),
    fee: 'R1 500',
    duration: '6 Months',
  },
  {
    id: 'FirstAid',
    title: 'First Aid',
    description: 'Learn CPR and emergency response techniques.',
    image: require('./assets/snack-icon.png'),
    fee: 'R1 500',
    duration: '6 Months',
  },
  {
    id: 'LifeSkills',
    title: 'Life Skills',
    description: 'Build confidence, communication, and decision-making.',
    image: require('./assets/snack-icon.png'),
    fee: 'R1 500',
    duration: '6 Months',
  },
  {
    id: 'Landscaping',
    title: 'Landscaping',
    description: 'Design and maintain beautiful outdoor spaces.',
    image: require('./assets/snack-icon.png'),
    fee: 'R1 500',
    duration: '6 Months',
  },
  // 6 WEEK COURSES
  {
    id: 'Cooking',
    title: 'Cooking',
    description: 'Master basic culinary skills and food safety.',
    image: require('./assets/snack-icon.png'),
    fee: 'R750',
    duration: '6 Weeks',
  },
  {
    id: 'ChildMinding',
    title: 'Child Minding',
    description: 'Care for and engage children in nurturing environments.',
    image: require('./assets/snack-icon.png'),
    fee: 'R750',
    duration: '6 Weeks',
  },
  {
    id: 'GardenMaintenance',
    title: 'Garden Maintenance',
    description: 'Hands-on experience in caring for plants and outdoor spaces.',
    image: require('./assets/snack-icon.png'),
    fee: 'R750',
    duration: '6 Weeks',
  },
];

// Helper function to extract the numerical fee value
const getFeeValue = (fee: string): number => {
  // Strips R, spaces, and commas, then converts to a number
  return parseInt(fee.replace(/[^0-9]/g, ''));
};

// --- DISCOUNT LOGIC ---
const calculateDiscount = (courseCount: number): number => {
    if (courseCount >= 4) {
        return 0.15; // 15% discount for 4+ courses
    } else if (courseCount === 3) {
        return 0.10; // 10% discount for 3 courses
    } else if (courseCount === 2) {
        return 0.05; // 5% discount for 2 courses
    }
    return 0; // 0% discount for 0 or 1 course
};


// --- SCREEN COMPONENTS ---

const EmpowerScreen: React.FC<{ navigation: EmpowerScreenNavigationProp }> = ({
  navigation,
}) => {
  return (
    <LinearGradient colors={['#AA7B39', '#795021']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentCentered}>
        <View style={styles.header}>
          <Image source={require('./assets/snack-icon.png')} style={styles.logo} />
          <Text style={styles.mainTitle}>EMPOWERING THE NATION</Text>
          <Text style={styles.tagline}>Upskill yourself. Empower your community.</Text>
        </View>

        <View style={styles.skillsGrid}>
          {skills.map((skill: Skill, index: number) => (
            <View key={index} style={styles.skillCardNew}>
              <Image source={skill.image} style={styles.skillImage} />
              <Text style={styles.skillLabelNew}>{skill.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.actionButtonText}> Get Started</Text>
        </TouchableOpacity>

        <View style={styles.authLinkContainer}>
          <Text style={styles.authText}>
            Already have an account?{' '}
            <Text style={styles.authLink} onPress={() => navigation.navigate('Login')}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// ------------------------------------
// 🌟 UPDATED LOGIN SCREEN (Load Email) 🌟
// ------------------------------------
const LoginScreen: React.FC<{ navigation: AuthScreenNavigationProp }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Load saved email on component mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(LAST_EMAIL_KEY);
        if (savedEmail !== null) {
          setEmail(savedEmail); // Pre-fill the email field
        }
      } catch (e) {
        console.error('Failed to load email from storage:', e);
      }
    };

    loadSavedEmail();
  }, []); // Empty dependency array means this runs only once on mount

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    
    // Optional: Basic Email Validation on Login
    if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    setIsLoading(true);
    setError('');

    // --- SIMULATED LOGIN LOGIC (Replace with your actual API call) ---
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple validation placeholder:
    if (email === 'user@example.com' && password === 'password') {
        // 2. Save the successfully used email for the next session
        try {
            await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
        } catch (e) {
             console.error('Error saving email on login success:', e);
        }
      
      navigation.navigate('AppDrawer', { screen: 'About' });
    } else {
      setError('Invalid email or password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <LinearGradient colors={['#633D17', '#AA7B39']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredContainer}
      >
        <View style={styles.formBox}>
          <Text style={styles.formTitle}>Welcome Back</Text>

          {/* Error Message Display */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            placeholder="Email"
            style={styles.inputNew}
            placeholderTextColor="#777"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TextInput
            placeholder="Password"
            style={styles.inputNew}
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={styles.backLink}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};
// ------------------------------------
// 🌟 UPDATED SIGN UP SCREEN (Validation & Save) 🌟
// ------------------------------------
const SignUpScreen: React.FC<{ navigation: AuthScreenNavigationProp }> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    // 1. Basic Field Validation
    if (!fullName || !email || !password) {
      setError('Please fill in all fields to create an account.');
      return;
    }

    // 2. Email Format Validation
    if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address (e.g., user@example.com).');
        return;
    }

    setIsLoading(true);
    setError('');

    // --- SIMULATED SIGN UP LOGIC (Replace with your actual API call) ---
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
        // 3. Save the email to AsyncStorage for the next login attempt
        await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
        console.log('Successfully saved email to storage.');
        
        // Assuming success, navigate to the Drawer
        navigation.navigate('AppDrawer', { screen: 'About' });
    } catch (e) {
        console.error('Error saving email:', e);
        setError('Account created, but could not save email preference.');
        // Still navigate on successful account creation, but log the storage error
        navigation.navigate('AppDrawer', { screen: 'About' }); 
    }

    setIsLoading(false);
  };

  return (
    <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredContainer}
      >
        <ScrollView contentContainerStyle={styles.formScrollContent}>
          <View style={styles.formBox}>
            <Text style={styles.formTitle}>Create Account</Text>

            {/* Error Message Display */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              placeholder="Full Name"
              style={styles.inputNew}
              placeholderTextColor="#777"
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Email"
              style={styles.inputNew}
              placeholderTextColor="#777"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              placeholder="Password"
              style={styles.inputNew}
              placeholderTextColor="#777"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
              <Text style={styles.backLink}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// --- SCREENS NOW INSIDE THE DRAWER ---
// ... (Your existing Drawer screen components go here: AboutScreen, CoursesScreen, CourseListScreen, etc.)
const AboutScreen: React.FC<DrawerScreenProps<'About'>> = ({ navigation }) => {
    return (
      <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MenuButton navigation={navigation} />
          <Image source={require('./assets/snack-icon.png')} style={styles.drawerHeaderImage} />
          <Text style={styles.drawerTitle}>Our Mission</Text>
          <Text style={styles.drawerText}>
            *Empowering The Nation* is dedicated to fostering personal and communal growth by
            offering *practical, high-demand skills training*. We believe that by investing in
            individuals, we strengthen the nation. Your skills are the foundation of a stronger
            future—let's build it together!
          </Text>
  
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Courses')}>
            <Text style={styles.primaryButtonText}>View Courses</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  };
  
  const CoursesScreen: React.FC<DrawerScreenProps<'Courses'>> = ({ navigation }) => {
    const courses: Course[] = [
      {
        id: '1',
        title: '6 Weeks Course',
        description:
          'Short-term training in practical skills like cooking, child care, and gardening. Perfect for a quick professional boost.',
        image: require('./assets/snack-icon.png'),
        target: 'SixWeekCourses',
      },
      {
        id: '2',
        title: '6 Months Course',
        description:
          'In-depth development in areas like first aid, sewing, life skills, and landscaping. A comprehensive career foundation.',
        image: require('./assets/snack-icon.png'),
        target: 'SixMonthCourses',
      },
    ];
  
      const renderItem = ({ item }: { item: Course }) => (
      <TouchableOpacity
        style={styles.courseCard}
        
  onPress={() => item.target && navigation.navigate(item.target as RoutesWithoutParams)}

      >
        <View style={styles.courseCardContent}>
          <Image source={item.image} style={styles.courseCardImage} />
          <View style={{ flex: 1, paddingLeft: SPACING }}>
            <Text style={styles.courseCardTitle}>{item.title}</Text>
            <Text style={styles.courseCardDescription}>{item.description}</Text>
            <View style={styles.courseCardButton}>
              <Text style={styles.courseCardButtonText}>Explore Options →</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  
    return (
      <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
        <MenuButton navigation={navigation} />
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Our Programs</Text>
        </View>
  <FlatList<Course>
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainerNew}
          renderItem={renderItem}
        />
      </LinearGradient>
    );
  };
  
  const CourseListScreen: React.FC<DrawerScreenProps<'SixWeekCourses' | 'SixMonthCourses'>> = ({
    navigation,
    route,
  }) => {
    let courses: Course[] = [];
    const isSixWeek = route.name === 'SixWeekCourses';
    const headerTitle = isSixWeek ? '6 Week Courses' : '6 Month Courses';
  
    if (isSixWeek) {
      courses = ALL_COURSES.filter(c => c.duration === '6 Weeks');
    } else {
      courses = ALL_COURSES.filter(c => c.duration === '6 Months');
    }
  
  const renderItem = ({ item }: { item: Course }) => (
      <View style={styles.courseListItem}>
        <Image source={item.image} style={styles.courseListItemImage} />
        <View style={styles.courseListItemTextContainer}>
          <Text style={styles.courseListItemTitle}>{item.title}</Text>
          <Text style={styles.courseListItemFee}>Fee: {item.fee}</Text>
          <Text style={styles.courseListItemDescription}>{item.description}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(item.id as RoutesWithoutParams)}
            style={styles.viewDetailsButton}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  
    return (
      <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
        <MenuButton navigation={navigation} />
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{headerTitle}</Text>
        </View>
        <FlatList<Course>
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainerNew}
          renderItem={renderItem}
        />
      </LinearGradient>
    );
  };
  
  // General Course Detail Screen Component
  interface DetailProps {
    title: string;
    subtitle: string;
    benefits: string[];
    jobs: string[];
    navigation: DrawerNavigationProp<AppDrawerParamList, keyof AppDrawerParamList>;
  }
  
  const CourseDetailScreen: React.FC<DetailProps> = ({
    title,
    subtitle,
    benefits,
    jobs,
    navigation,
  }) => (
    <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MenuButton navigation={navigation} />
        <Image source={require('./assets/snack-icon.png')} style={styles.detailImage} />
  
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailSubtitle}>{subtitle}</Text>
  
        <View style={styles.sectionContainer}>
          <Text style={styles.detailSectionTitle}>Benefits of the Course</Text>
          {benefits.map((benefit, index) => (
            <Text key={index} style={styles.detailListItem}>
              • {benefit}
            </Text>
          ))}
        </View>
  
        <View style={styles.sectionContainer}>
          <Text style={styles.detailSectionTitle}>Career Opportunities</Text>
          {jobs.map((job, index) => (
            <Text key={index} style={styles.detailListItem}>
              • {job}
            </Text>
          ))}
        </View>
  
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CourseSelection')}
        >
          <Text style={styles.primaryButtonText}>Select Course</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
  
  // Specific Course Screen Components using the General Detail Screen
  
  const CookingScreen: React.FC<DrawerScreenProps<'Cooking'>> = ({ navigation }) => (
    <CourseDetailScreen
      title="Cooking Course"
      subtitle="Learn how to prepare meals, handle ingredients, and master basic culinary skills."
      benefits={[
        'Gain practical cooking skills',
        'Improve nutrition and food safety knowledge',
        'Become confident in the kitchen',
      ]}
      jobs={['Assistant Chef', 'Catering Assistant', 'Home Cook Professional']}
      navigation={navigation}
    />
  );
  
  const ChildMindingScreen: React.FC<DrawerScreenProps<'ChildMinding'>> = ({ navigation }) => (
    <CourseDetailScreen
      title="Child Minding"
      subtitle="Learn to care for children with compassion, creativity, and safety in mind."
      benefits={[
        'Build nurturing and communication skills',
        'Understand child development and safety',
        'First-response knowledge for child-related incidents',
      ]}
      jobs={['Daycare Assistant', 'Babysitter', 'Nanny']}
      navigation={navigation}
    />
  );
  
  const GardenMaintenanceScreen: React.FC<DrawerScreenProps<'GardenMaintenance'>> = ({
    navigation,
  }) => (
    <CourseDetailScreen
      title="Garden Maintenance"
      subtitle="Learn to care for plants, manage outdoor spaces, and create green environments."
      benefits={[
        'Practical gardening and landscaping skills',
        'Environmental awareness and sustainability',
        'Horticulture basics and pest control',
      ]}
      jobs={['Garden Maintenance Worker', 'Landscaping Assistant', 'Nursery Attendant']}
      navigation={navigation}
    />
  );
  
  const SewingScreen: React.FC<DrawerScreenProps<'Sewing'>> = ({ navigation }) => (
    <CourseDetailScreen
      title="Sewing"
      subtitle="Learn the art of stitching, fabric handling, and garment creation—from thread to form."
      benefits={[
        'Develop precision and creativity in sewing',
        'Understand patterns, textiles, and tailoring techniques',
        'Repair and alter garments professionally',
      ]}
      jobs={['Seamstress or Tailor', 'Clothing Repair Specialist', 'Textile Artist']}
      navigation={navigation}
    />
  );
  
  const FirstAidScreen: React.FC<DrawerScreenProps<'FirstAid'>> = ({ navigation }) => (
    <CourseDetailScreen
      title="First Aid"
      subtitle="Learn life-saving techniques and emergency response skills for real-world situations."
      benefits={[
        'CPR and basic life support training',
        'Confidence in emergency situations',
        'Wound management and basic trauma care',
      ]}
      jobs={['Safety Officer', 'Community Health Volunteer', 'School First Aider']}
      navigation={navigation}
    />
  );
  
  const LifeSkillsScreen: React.FC<DrawerScreenProps<'LifeSkills'>> = ({ navigation }) => (
    <CourseDetailScreen
      title="Life Skills"
      subtitle="Develop essential skills for personal growth, emotional resilience, and everyday decision-making."
      benefits={[
        'Strengthen communication and self-awareness',
        'Build confidence and emotional intelligence',
        'Financial planning and problem-solving techniques',
      ]}
      jobs={['Peer Mentor', 'Community Support Worker', 'Workshop Facilitator']}
      navigation={navigation}
    />
  );
  
  const LandscapingScreen: React.FC<DrawerScreenProps<'Landscaping'>> = ({ navigation }) => (
    <CourseDetailScreen
      title="Landscaping"
      subtitle="Design and maintain outdoor spaces that inspire peace, beauty, and sustainability."
      benefits={[
        'Learn garden design and plant care principles',
        'Develop eco-friendly landscaping techniques',
        'Site analysis and design execution',
        ]}
      jobs={['Landscape Technician', 'Groundskeeper', 'Horticultural Designer']}
      navigation={navigation}
    />
  );
  
  const CourseSelectionItem: React.FC<{
    course: Course & { duration: string };
    isSelected: boolean;
    onToggle: (id: string) => void;
  }> = ({ course, isSelected, onToggle }) => (
    <View style={styles.selectionItemContainer}>
      <View style={styles.selectionItemText}>
        <Text style={styles.selectionItemCourse}>Course: {course.title}</Text>
        <Text style={styles.selectionItemFee}>Fee: {course.fee}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.checkbox,
          isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
        ]}
        onPress={() => onToggle(course.id)}
      >
        {isSelected && <Ionicons name="checkmark" size={20} color="white" />}
      </TouchableOpacity>
    </View>
  );
  
  const CourseSelectionScreen: React.FC<DrawerScreenProps<'CourseSelection'>> = ({
    navigation,
  }) => {
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  
    const handleToggle = (id: string) => {
      setSelectedCourseIds((prev) =>
        prev.includes(id) ? prev.filter((courseId) => courseId !== id) : [...prev, id]
      );
    };
  
    const handleNext = () => {
      navigation.navigate('Confirmation', { selectedCourseIds });
    };
  
    const groupedCourses = ALL_COURSES.reduce(
      (acc, course) => {
        const duration = (course as Course & { duration: string }).duration;
        if (!acc[duration]) {
          acc[duration] = [];
        }
        acc[duration].push(course as Course & { duration: string });
        return acc;
      },
      {} as Record<string, (Course & { duration: string })[]>
    );
  
    const renderCourseGroup = (duration: string, courses: (Course & { duration: string })[]) => (
      <View key={duration} style={styles.courseGroup}>
        <Text style={styles.courseGroupTitle}>{duration.toUpperCase()} COURSES</Text>
        {courses.map((course) => (
          <CourseSelectionItem
            key={course.id}
            course={course}
            isSelected={selectedCourseIds.includes(course.id)}
            onToggle={handleToggle}
          />
        ))}
      </View>
    );
  
    return (
      <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.selectionMainTitle}>SELECT COURSE(S)</Text>
  
          {Object.entries(groupedCourses).map(([duration, courses]) =>
            renderCourseGroup(duration, courses)
          )}
  
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={handleNext}
            disabled={selectedCourseIds.length === 0}
          >
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  };
  
  
  // --- UPDATED CONFIRMATION SCREEN ---
  
  const ConfirmationScreen: React.FC<DrawerScreenProps<'Confirmation'>> = ({ route, navigation }) => {
      const { selectedCourseIds } = route.params;
      // finalTotal is now calculated directly or within useEffect
      const [finalTotal, setFinalTotal] = useState<number | null>(null);
  
      const selectedCourses = ALL_COURSES.filter((c) => selectedCourseIds.includes(c.id));
      const baseTotal = selectedCourses.reduce((sum, course) => sum + getFeeValue(course.fee!), 0);
      const courseCount = selectedCourseIds.length;
      const discountRate = calculateDiscount(courseCount);
      const discountAmount = baseTotal * discountRate;
      const finalAmount = baseTotal - discountAmount;
  
      // Use useEffect to calculate the total immediately when component loads
      // or when selectedCourseIds changes (though for this screen, it only loads once)
      useEffect(() => {
          // Automatically calculate and set the final total
          setFinalTotal(finalAmount);
      }, [finalAmount]); // Recalculate if the finalAmount changes (safety, though it's static here)
  
      const handlePay = () => {
          if (finalTotal !== null) {
              alert(`Proceeding to payment for R ${finalTotal.toLocaleString()} for ${courseCount} course(s).`);
              // Here you would integrate your actual payment gateway logic
          }
      };
  
      return (
          <LinearGradient colors={['#AA7B39', '#633D17']} style={styles.container}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                      <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
  
                  {/* Title updated to reflect its role */}
                  <Text style={styles.confirmationTitle}>Order Summary</Text> 
                  
                  <View style={styles.calculationBox}>
                      {courseCount > 0 ? (
                          <>
                              <Text style={styles.calculationText}>
                                  Courses Selected: {courseCount}
                              </Text>
                              <Text style={styles.calculationText}>
                                  Base Total Fee: R {baseTotal.toLocaleString()}
                              </Text>
                              
                              {discountRate > 0 ? (
                                  <>
                                      <Text style={styles.discountText}>
                                          Discount Applied: {discountRate * 100}%
                                      </Text>
                                      <Text style={styles.discountAmountDetail}>
                                          (You save R {discountAmount.toLocaleString()})
                                      </Text>
                                  </>
                              ) : (
                                  <Text style={styles.calculationText}>No discount applied.</Text>
                              )}
                              
                              {/* Final Total Display is always present if courses are selected */}
                              <View style={styles.finalTotalOutput}>
                                  <Text style={styles.finalTotalLabel}>NET FEE:</Text>
                                  <Text style={styles.finalTotalAmount}>
                                      R {finalTotal !== null ? finalTotal.toLocaleString() : baseTotal.toLocaleString()}
                                  </Text>
                              </View>
                          </>
                      ) : (
                          <Text style={styles.calculationText}>
                              No courses selected. Please go back to choose a course.
                          </Text>
                      )}
                  </View>
  
                  {/* The manual "Total" button is REMOVED */}
  
                  {/* PAY Button is enabled as soon as the screen loads (since finalTotal is set in useEffect) */}
                  <TouchableOpacity
                      style={styles.payButton}
                      onPress={handlePay}
                      // It is disabled only if no courses were selected (courseCount === 0)
                      disabled={courseCount === 0} 
                  >
                      <Text style={styles.payButtonText}>PAY NOW</Text>
                  </TouchableOpacity>
  
              </ScrollView>
          </LinearGradient>
      );
  };
// --- NAVIGATION STRUCTURES ---

const AppDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="About"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#633D17', // Darker background for the drawer
          paddingTop: 50,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
        drawerActiveTintColor: '#633D17', // Dark text color for active item
        drawerInactiveTintColor: 'white', // White text for inactive items
        drawerActiveBackgroundColor: '#D4AF37', // Gold-ish background for active item
        drawerInactiveBackgroundColor: 'transparent',
        // sceneContainerStyle is not a valid Drawer option; removed to satisfy types
      }}
    >
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Courses" component={CoursesScreen} />

      {/* Hidden Screens (Accessed via button press, not the main menu) */}
      <Drawer.Screen
        name="SixWeekCourses"
        component={CourseListScreen}
        options={{ drawerLabel: '6 Week Courses', drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="SixMonthCourses"
        component={CourseListScreen}
        options={{ drawerLabel: '6 Month Courses', drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="Cooking"
        component={CookingScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="ChildMinding"
        component={ChildMindingScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="GardenMaintenance"
        component={GardenMaintenanceScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="Sewing"
        component={SewingScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="FirstAid"
        component={FirstAidScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="LifeSkills"
        component={LifeSkillsScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="Landscaping"
        component={LandscapingScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="CourseSelection"
        component={CourseSelectionScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      <Drawer.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
    </Drawer.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Empower"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Empower" component={EmpowerScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="AppDrawer" component={AppDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING,
    paddingTop: SPACING * 3,
    alignItems: 'center',
  },
  scrollContentCentered: {
    padding: SPACING,
    paddingTop: SPACING * 3,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING * 2,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 50,
    backgroundColor: 'white',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#D4AF37',
    marginTop: 5,
    fontStyle: 'italic',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: width - SPACING * 2,
    marginBottom: SPACING * 2,
  },
  skillCardNew: {
    width: (width - SPACING * 3) / 2, // Two columns with spacing
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  skillImage: {
    width: 40,
    height: 40,
    marginBottom: 5,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
  },
  skillLabelNew: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: 200,
  },
  actionButtonText: {
    color: '#633D17',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  authLinkContainer: {
    marginTop: 30,
  },
  authText: {
    color: 'white',
    fontSize: 16,
  },
  authLink: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  // --- Form Styles ---
  formBox: {
    width: width * 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: SPACING,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING * 1.5,
  },
  inputNew: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#FFD700',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    backgroundColor: 'rgba(200, 0, 0, 0.3)',
    borderRadius: 5,
    width: '100%',
  },
  backLink: {
    color: 'white',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING * 2,
  },

  // --- Drawer Screen Styles ---
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  drawerHeaderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    backgroundColor: '#D4AF37',
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  drawerText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: SPACING / 2,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#633D17',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // --- Courses Screen Styles ---
  listHeader: {
    width: '100%',
    paddingHorizontal: SPACING,
    paddingTop: SPACING * 2,
    marginBottom: SPACING,
  },
  listTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING,
  },
  listContainerNew: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING * 2,
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    marginBottom: SPACING,
    padding: SPACING,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  courseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseCardImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
  },
  courseCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  courseCardDescription: {
    fontSize: 14,
    color: '#D4AF37',
  },
  courseCardButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  courseCardButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  courseListItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  courseListItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    marginRight: 10,
  },
  courseListItemTextContainer: {
    flex: 1,
  },
  courseListItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  courseListItemFee: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 2,
  },
  courseListItemDescription: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
  viewDetailsButton: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
    alignSelf: 'flex-start',
  },
  viewDetailsButtonText: {
    color: '#633D17',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // --- Detail Screen Styles ---
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
    backgroundColor: '#D4AF37',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  detailSubtitle: {
    fontSize: 16,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: SPACING * 1.5,
    paddingHorizontal: SPACING,
  },
  sectionContainer: {
    width: '100%',
    paddingHorizontal: SPACING,
    marginBottom: SPACING,
  },
  detailSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    paddingBottom: 5,
  },
  detailListItem: {
    fontSize: 16,
    color: 'white',
    marginLeft: 10,
    marginBottom: 5,
  },
  // --- Selection Screen Styles ---
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  selectionMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING * 2,
    marginTop: SPACING,
  },
  courseGroup: {
    width: '100%',
    marginBottom: SPACING * 1.5,
  },
  courseGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.5)',
    paddingBottom: 5,
  },
  selectionItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectionItemText: {
    flex: 1,
  },
  selectionItemCourse: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  selectionItemFee: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 2,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkboxSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#D4AF37',
  },
  checkboxUnselected: {
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  calculateButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 30,
    minWidth: 200,
    alignSelf: 'center',
  },
  calculateButtonText: {
    color: '#633D17',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // --- Confirmation Screen Styles ---
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING * 2,
    marginTop: SPACING,
  },
  calculationBox: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: SPACING,
    marginBottom: SPACING * 2,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  calculationText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    lineHeight: 24,
  },
  discountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38D437', // Green for discount
    marginTop: 10,
    marginBottom: 2,
  },
  discountAmountDetail: {
    fontSize: 14,
    color: '#38D437',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  finalTotalOutput: {
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
    paddingTop: 15,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  finalTotalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  payButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 20,
    minWidth: 250,
    alignSelf: 'center',
  },
  payButtonText: {
    color: '#633D17',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AppNavigator;