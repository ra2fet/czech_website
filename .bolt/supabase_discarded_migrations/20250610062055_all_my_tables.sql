/*
  # Recreate All Tables with Sample Data

  1. Drop existing tables (if they exist)
  2. Recreate tables with proper structure
  3. Insert comprehensive sample data for:
    - products (with retail and wholesale specs)
    - locations (with coordinates and contact info)
    - blogs (with content and images)

  4. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin access
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  retail_price numeric NOT NULL,
  wholesale_price numeric NOT NULL,
  retail_specs jsonb DEFAULT '{}'::jsonb,
  wholesale_specs jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text,
  email text,
  position point,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
   - `locations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `position` (point)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow public read access to products"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated admins full access to products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for locations
CREATE POLICY "Allow public read access to locations"
  ON locations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated admins full access to locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for blogs
CREATE POLICY "Allow public read access to blogs"
  ON blogs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated admins full access to blogs"
  ON blogs
  FOR ALL
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for products
INSERT INTO products (name, description, image_url, retail_price, wholesale_price, retail_specs, wholesale_specs) VALUES
(
  'Professional Business Suite Pro',
  'A comprehensive business management solution designed for modern enterprises. Features advanced analytics, workflow automation, and seamless integration capabilities.',
  'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  299.99,
  199.99,
  '{"dimensions": "12 x 8 x 2 inches", "weight": "2.5 lbs", "material": "Premium aluminum alloy", "warranty": "2 years", "compatibility": "Windows, macOS, Linux"}'::jsonb,
  '{"quantity": 50, "dimensions": "24 x 18 x 12 inches", "weight": "150 lbs", "material": "Premium aluminum alloy", "bulk_discount": "33% off retail", "shipping": "Free freight shipping"}'::jsonb
),
(
  'Enterprise Analytics Dashboard',
  'Real-time data visualization and business intelligence platform. Transform your data into actionable insights with our powerful analytics engine.',
  'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  499.99,
  349.99,
  '{"dimensions": "Digital product", "weight": "N/A", "material": "Software license", "warranty": "1 year support", "users": "Up to 10 users"}'::jsonb,
  '{"quantity": 100, "dimensions": "Digital product", "weight": "N/A", "material": "Software license", "bulk_discount": "30% off retail", "users": "Unlimited users"}'::jsonb
),
(
  'Smart Automation Controller',
  'IoT-enabled automation system for smart offices and manufacturing facilities. Control and monitor your environment with precision and efficiency.',
  'https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  799.99,
  599.99,
  '{"dimensions": "8 x 6 x 3 inches", "weight": "1.8 lbs", "material": "Industrial-grade plastic", "warranty": "3 years", "connectivity": "WiFi, Bluetooth, Ethernet"}'::jsonb,
  '{"quantity": 25, "dimensions": "20 x 16 x 10 inches", "weight": "50 lbs", "material": "Industrial-grade plastic", "bulk_discount": "25% off retail", "installation": "Professional setup included"}'::jsonb
),
(
  'Cloud Security Suite',
  'Advanced cybersecurity solution with AI-powered threat detection, real-time monitoring, and comprehensive data protection for businesses of all sizes.',
  'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  399.99,
  279.99,
  '{"dimensions": "Digital product", "weight": "N/A", "material": "Software license", "warranty": "1 year support", "devices": "Up to 25 devices"}'::jsonb,
  '{"quantity": 500, "dimensions": "Digital product", "weight": "N/A", "material": "Software license", "bulk_discount": "30% off retail", "devices": "Unlimited devices"}'::jsonb
),
(
  'Mobile Productivity Hub',
  'Portable workstation designed for remote professionals. Includes wireless charging, multiple connectivity options, and ergonomic design.',
  'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  199.99,
  139.99,
  '{"dimensions": "14 x 10 x 1.5 inches", "weight": "3.2 lbs", "material": "Carbon fiber composite", "warranty": "2 years", "battery": "12-hour battery life"}'::jsonb,
  '{"quantity": 75, "dimensions": "28 x 20 x 15 inches", "weight": "280 lbs", "material": "Carbon fiber composite", "bulk_discount": "30% off retail", "accessories": "Complete accessory kit included"}'::jsonb
),
(
  'AI-Powered Communication Platform',
  'Next-generation communication suite with AI translation, smart scheduling, and integrated video conferencing for global teams.',
  'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  599.99,
  419.99,
  '{"dimensions": "Digital product", "weight": "N/A", "material": "Software license", "warranty": "1 year support", "users": "Up to 50 users"}'::jsonb,
  '{"quantity": 200, "dimensions": "Digital product", "weight": "N/A", "material": "Software license", "bulk_discount": "30% off retail", "users": "Unlimited users"}'::jsonb
);

-- Insert sample data for locations
INSERT INTO locations (name, address, phone, email, position, image_url) VALUES
(
  'Headquarters - New York',
  '123 Business Avenue, Suite 100, New York, NY 10001, USA',
  '+1 (212) 555-1234',
  'ny@company.com',
  POINT(40.7128, -74.0060),
  'https://images.pexels.com/photos/260689/pexels-photo-260689.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Regional Office - London',
  '45 Park Lane, Mayfair, London W1K 1PN, United Kingdom',
  '+44 20 7123 4567',
  'london@company.com',
  POINT(51.5074, -0.1278),
  'https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Innovation Hub - San Francisco',
  '789 Tech Drive, Silicon Valley, CA 94010, USA',
  '+1 (650) 555-9876',
  'sf@company.com',
  POINT(37.7749, -122.4194),
  'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Asia Pacific Center - Singapore',
  '1 Marina Bay Sands, Level 20, Singapore 018956',
  '+65 6789 0123',
  'singapore@company.com',
  POINT(1.2966, 103.8547),
  'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'European Operations - Berlin',
  'Potsdamer Platz 1, 10785 Berlin, Germany',
  '+49 30 1234 5678',
  'berlin@company.com',
  POINT(52.5200, 13.4050),
  'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Research & Development - Tokyo',
  '1-1-1 Shibuya, Shibuya City, Tokyo 150-0002, Japan',
  '+81 3 1234 5678',
  'tokyo@company.com',
  POINT(35.6762, 139.6503),
  'https://images.pexels.com/photos/2506947/pexels-photo-2506947.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
);

-- Insert sample data for blogs
INSERT INTO blogs (title, content, excerpt, image_url) VALUES
(
  'The Future of Business Automation: Trends to Watch in 2025',
  'As we move into 2025, business automation continues to evolve at an unprecedented pace. From AI-powered decision making to robotic process automation, companies are finding new ways to streamline operations and improve efficiency.

In this comprehensive analysis, we explore the key trends shaping the automation landscape:

**1. Intelligent Process Automation (IPA)**
The integration of artificial intelligence with traditional automation tools is creating more sophisticated systems capable of handling complex, unstructured tasks. IPA combines machine learning, natural language processing, and cognitive technologies to automate processes that previously required human intervention.

**2. Hyperautomation**
Organizations are moving beyond automating individual tasks to creating end-to-end automated workflows. This holistic approach involves identifying, vetting, and automating as many business processes as possible using a combination of tools and technologies.

**3. Low-Code/No-Code Automation**
The democratization of automation through low-code and no-code platforms is enabling business users to create automated workflows without extensive technical knowledge. This trend is accelerating automation adoption across all departments.

**4. AI-Driven Analytics**
Automation systems are becoming more intelligent, using AI to analyze patterns, predict outcomes, and make recommendations for process improvements. This creates a continuous feedback loop for optimization.

**5. Human-Centric Automation**
The focus is shifting from replacing humans to augmenting human capabilities. Modern automation solutions are designed to work alongside employees, handling routine tasks while freeing humans to focus on creative and strategic work.

As these trends continue to develop, businesses that embrace automation will gain significant competitive advantages in efficiency, accuracy, and scalability.',
  'Discover the key automation trends that will shape business operations in 2025, from intelligent process automation to human-centric design approaches.',
  'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Maximizing ROI with Smart Technology Investments',
  'In today''s competitive business environment, making smart technology investments is crucial for long-term success. However, with countless options available, how do you ensure maximum return on investment?

**Strategic Planning is Key**
Before investing in any technology, it''s essential to align your choices with your business objectives. Start by identifying pain points in your current operations and determining how technology can address these challenges.

**Focus on Scalable Solutions**
Choose technologies that can grow with your business. Scalable solutions may require a higher initial investment but provide better long-term value as your company expands.

**Integration Capabilities**
Ensure new technologies can integrate seamlessly with your existing systems. Poor integration can lead to data silos and reduced efficiency, negating the benefits of your investment.

**Training and Adoption**
The best technology is worthless if your team doesn''t know how to use it effectively. Budget for comprehensive training programs and change management initiatives.

**Measure and Monitor**
Establish clear metrics to track the performance of your technology investments. Regular monitoring allows you to make adjustments and optimize your ROI over time.

**Case Study: Manufacturing Company Transformation**
A mid-sized manufacturing company invested in an integrated ERP system, resulting in:
- 35% reduction in operational costs
- 50% improvement in inventory management
- 25% increase in customer satisfaction

The key to their success was careful planning, employee training, and continuous optimization based on performance data.',
  'Learn proven strategies for making technology investments that deliver measurable returns and drive business growth.',
  'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Cybersecurity Best Practices for Modern Businesses',
  'With cyber threats becoming increasingly sophisticated, businesses of all sizes must prioritize cybersecurity. Here''s a comprehensive guide to protecting your organization in 2025.

**The Current Threat Landscape**
Cybercriminals are using advanced techniques including AI-powered attacks, social engineering, and zero-day exploits. The average cost of a data breach has reached $4.45 million, making prevention more critical than ever.

**Essential Security Measures**

**1. Multi-Factor Authentication (MFA)**
Implement MFA across all systems and applications. This simple step can prevent up to 99.9% of automated attacks.

**2. Regular Security Training**
Human error remains the leading cause of security breaches. Conduct regular training sessions to keep employees informed about the latest threats and best practices.

**3. Zero Trust Architecture**
Adopt a "never trust, always verify" approach. Zero trust assumes that threats can come from anywhere and requires verification for every access request.

**4. Regular Updates and Patches**
Keep all software, operating systems, and security tools up to date. Automated patch management systems can help ensure timely updates.

**5. Data Backup and Recovery**
Implement a robust backup strategy with regular testing of recovery procedures. The 3-2-1 rule (3 copies, 2 different media, 1 offsite) is a good starting point.

**6. Network Segmentation**
Divide your network into segments to limit the spread of potential breaches. Critical systems should be isolated from general network traffic.

**Incident Response Planning**
Develop and regularly test an incident response plan. Quick response can significantly reduce the impact of a security breach.

**Compliance Considerations**
Stay informed about relevant regulations such as GDPR, CCPA, and industry-specific requirements. Compliance isn''t just about avoiding fines—it''s about protecting your customers and reputation.',
  'Essential cybersecurity strategies to protect your business from evolving threats and maintain customer trust in the digital age.',
  'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Building Resilient Supply Chains in a Global Economy',
  'The global supply chain disruptions of recent years have highlighted the importance of building resilient, adaptable supply networks. Here''s how businesses can create more robust supply chains.

**Understanding Supply Chain Resilience**
Resilience goes beyond efficiency—it''s about the ability to anticipate, adapt to, and recover from disruptions while maintaining operations and serving customers.

**Key Strategies for Resilience**

**1. Diversification**
Avoid over-reliance on single suppliers or geographic regions. Develop relationships with multiple suppliers across different locations to reduce risk.

**2. Visibility and Transparency**
Implement technologies that provide real-time visibility into your supply chain. IoT sensors, blockchain, and AI analytics can help track products and predict potential issues.

**3. Flexible Logistics**
Develop multiple transportation options and routes. This flexibility allows you to quickly adapt when primary channels are disrupted.

**4. Strategic Inventory Management**
Balance efficiency with resilience by maintaining strategic inventory buffers for critical components while using just-in-time approaches for non-critical items.

**5. Supplier Relationship Management**
Build strong partnerships with key suppliers. Regular communication, joint planning, and mutual support create more resilient relationships.

**Technology Solutions**
- AI-powered demand forecasting
- Blockchain for supply chain transparency
- Digital twins for scenario planning
- Automated risk monitoring systems

**Case Study: Automotive Industry Adaptation**
A major automotive manufacturer implemented a multi-tier supplier visibility system, resulting in:
- 40% reduction in supply chain disruptions
- 25% improvement in delivery performance
- 30% faster response to supply issues

**Future Considerations**
As supply chains become more complex, businesses must balance global efficiency with local resilience. The most successful companies will be those that can adapt quickly to changing conditions while maintaining high service levels.',
  'Strategies for building supply chain resilience that can withstand global disruptions while maintaining efficiency and customer satisfaction.',
  'https://images.pexels.com/photos/2977565/pexels-photo-2977565.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'The Rise of Remote Work: Tools and Technologies for Success',
  'Remote work has transformed from a temporary solution to a permanent fixture in the modern workplace. Here''s how to leverage technology for remote work success.

**The Remote Work Revolution**
Recent studies show that 42% of the U.S. workforce now works remotely full-time, with hybrid models becoming increasingly popular. This shift requires new approaches to collaboration, communication, and productivity.

**Essential Remote Work Technologies**

**1. Communication Platforms**
- Video conferencing tools with screen sharing and recording capabilities
- Instant messaging platforms for quick communication
- Asynchronous communication tools for different time zones

**2. Collaboration Software**
- Cloud-based document sharing and editing
- Project management platforms
- Virtual whiteboarding tools for brainstorming

**3. Productivity Tools**
- Time tracking and task management applications
- Focus apps to minimize distractions
- Automated workflow tools

**4. Security Solutions**
- VPN access for secure connections
- Endpoint protection for remote devices
- Secure file sharing platforms

**Best Practices for Remote Teams**

**Establish Clear Communication Protocols**
Define when to use different communication channels and set expectations for response times.

**Create Virtual Water Cooler Moments**
Schedule informal virtual meetings to maintain team relationships and company culture.

**Focus on Outcomes, Not Hours**
Measure productivity by results rather than time spent online.

**Provide Proper Equipment**
Invest in quality hardware and software to ensure employees can work effectively from home.

**Regular Check-ins**
Maintain regular one-on-one meetings to address challenges and provide support.

**Measuring Remote Work Success**
- Employee satisfaction surveys
- Productivity metrics
- Collaboration frequency
- Work-life balance indicators

The future of work is flexible, and organizations that embrace remote work technologies and practices will attract top talent and maintain competitive advantages.',
  'Essential technologies and strategies for building successful remote work environments that boost productivity and employee satisfaction.',
  'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
),
(
  'Sustainable Business Practices: Technology''s Role in Going Green',
  'Sustainability is no longer optional—it''s a business imperative. Discover how technology can help your organization reduce its environmental impact while improving efficiency.

**The Business Case for Sustainability**
Companies with strong sustainability practices see:
- 16% higher profitability
- 25% better stock performance
- Improved brand reputation and customer loyalty
- Better talent attraction and retention

**Technology-Driven Sustainability Solutions**

**1. Energy Management Systems**
Smart building technologies can reduce energy consumption by up to 30% through:
- Automated lighting and HVAC controls
- Real-time energy monitoring
- Predictive maintenance to optimize equipment efficiency

**2. Digital Transformation**
Moving to digital processes reduces paper consumption and improves efficiency:
- Electronic document management
- Digital signatures and approvals
- Virtual meetings reducing travel

**3. Supply Chain Optimization**
AI and analytics help optimize logistics for reduced environmental impact:
- Route optimization for delivery vehicles
- Demand forecasting to reduce waste
- Supplier sustainability tracking

**4. Circular Economy Technologies**
- IoT sensors for product lifecycle tracking
- Blockchain for supply chain transparency
- AI for waste reduction and recycling optimization

**Implementation Strategies**

**Start with Measurement**
You can''t improve what you don''t measure. Implement systems to track:
- Energy consumption
- Waste generation
- Carbon footprint
- Water usage

**Set Clear Goals**
Establish specific, measurable sustainability targets with timelines.

**Employee Engagement**
Create awareness programs and incentives for sustainable behaviors.

**Partner with Suppliers**
Work with suppliers who share your sustainability values and goals.

**Success Story: Tech Company Goes Carbon Neutral**
A software company achieved carbon neutrality through:
- 100% renewable energy for data centers
- Remote work policies reducing commuting
- Digital-first operations eliminating paper
- Carbon offset programs for remaining emissions

**Future Trends**
- AI-powered sustainability analytics
- Renewable energy integration
- Sustainable product design
- Circular economy business models

Sustainability and profitability are not mutually exclusive—technology makes it possible to achieve both.',
  'How modern businesses can leverage technology to implement sustainable practices that benefit both the environment and the bottom line.',
  'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
);